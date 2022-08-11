import type { Plugin } from "../..";
import type { Build, ExistingFile, File, FilesByType } from "./types";
import type { CompilerHost, Diagnostic, SemanticDiagnosticsBuilderProgram } from "typescript";

import { readFileSync } from "fs";
import { normalizeCase } from "../../../util/path";
import { fileExists, isCaseSensitive } from "../../../util/fs";
import { compareArrays, compareObjects, concat, endsWith } from "../../../util/data";

export enum FileKind {
  Missing,
  Existing
}

export class Program {
  public host!: CompilerHost;
  public builder!: SemanticDiagnosticsBuilderProgram;

  private files: Map<string, File> = new Map();
  readonly filesByType: FilesByType = {
    json: new Set(),
    declaration: new Set()
  };

  constructor(private plugin: Plugin) {}

  public init() {
    this.host = this.createHost();
    this.update();
  }

  public update() {
    if (!this.isBuilderUpToDate()) this.builder = this.createBuilder();
    while (this.builder.getSemanticDiagnosticsOfNextAffectedFile());
  }

  public check(files: Set<string>) {
    let syntacticDiagnostics: Readonly<Diagnostic>[] = [],
      semanticDiagnostics: Readonly<Diagnostic>[] = [];

    for (let path of files) {
      let source = this.getSource(path);
      if (!source) continue;

      concat(syntacticDiagnostics, this.builder.getSyntacticDiagnostics(source));
      concat(semanticDiagnostics, this.builder.getSemanticDiagnostics(source));
    }

    this.plugin.diagnostics.print(syntacticDiagnostics);
    this.plugin.diagnostics.print(semanticDiagnostics);
    this.plugin.diagnostics.print(this.builder.getGlobalDiagnostics());
  }

  public getBuild(path: string) {
    let file = this.getFile(path);
    if (file.kind !== FileKind.Existing) return null;
    if (file.build) return file.build;
    return this.buildFile(path);
  }

  public updateFile(path: string) {
    let current = this.files.get(path);
    if (!current) return this.createFile(path);

    let data = this.getData(path),
      version = new Date().getTime(),
      file: File;

    if (data === null) file = { kind: FileKind.Missing, version };
    else {
      let source = this.plugin.compiler.instance.createSourceFile(path, data, this.plugin.config.target);
      source.version = version.toString();
      file = { kind: FileKind.Existing, version, source };
    }
    return this.setFile(path, file);
  }

  public removeFile(path: string) {
    let file = this.files.get(path);
    if (!file) return;
    return this.setFile(path, { kind: FileKind.Missing, version: new Date().getTime() });
  }

  private setFile(path: string, file: File) {
    this.files.set(path, file);
    return file;
  }

  private getFile(path: string) {
    return this.files.get(path) ?? this.createFile(path);
  }

  private getData(path: string) {
    if (!fileExists(path)) return null;
    try {
      return readFileSync(path, "utf-8");
    } catch {
      this.plugin.logger.error({ message: "Failed to read file.", path });
      return null;
    }
  }

  private getSource(path: string) {
    let file = this.getFile(path);
    return file.kind !== FileKind.Missing ? file.source : undefined;
  }

  private getSourceVersion(path: string) {
    let file = this.files.get(path);
    return file?.kind !== FileKind.Existing ? undefined : file.source.version;
  }

  private createFile(path: string) {
    let compiler = this.plugin.compiler.instance,
      data = this.getData(path),
      version = new Date().getTime(),
      file: File;

    if (endsWith(path, ".json")) this.filesByType.json.add(path);
    else if (endsWith(path, ".d.ts", ".d.mts", ".d.cts")) this.filesByType.declaration.add(path);

    if (data === null) file = { kind: FileKind.Missing, version };
    else {
      let source = compiler.createSourceFile(path, data, this.plugin.config.target);
      source.version = version.toString();
      file = { kind: FileKind.Existing, version, source };
    }
    return this.setFile(path, file);
  }

  private createHost(): CompilerHost {
    let compiler = this.plugin.compiler.instance;
    return {
      fileExists: compiler.sys.fileExists,
      getCanonicalFileName: normalizeCase,
      getCurrentDirectory: () => this.plugin.cwd,
      getDefaultLibFileName: compiler.getDefaultLibFilePath,
      getNewLine: () => compiler.sys.newLine,
      getSourceFile: id => this.getSource(this.plugin.resolver.toPath(id)),
      getSourceFileByPath: (id, path) => this.getSource(path),
      readFile: compiler.sys.readFile,
      writeFile: () => {},
      useCaseSensitiveFileNames: () => isCaseSensitive,
      createHash: compiler.sys.createHash,
      directoryExists: compiler.sys.directoryExists,
      getDirectories: compiler.sys.getDirectories,
      getModuleResolutionCache: () => this.plugin.resolver.cache,
      readDirectory: compiler.sys.readDirectory,
      realpath: compiler.sys.realpath,
      resolveModuleNames: (ids, origin) => ids.map(id => this.plugin.resolver.resolve(id, origin)),
      onReleaseOldSourceFile: source => this.deleteFile(source.resolvedPath)
    };
  }

  private createBuilder() {
    return this.plugin.compiler.instance.createSemanticDiagnosticsBuilderProgram(
      this.plugin.config.rootFileNames,
      this.plugin.config.options,
      this.host,
      this.builder,
      undefined,
      this.plugin.config.references
    );
  }

  private buildFile(path: string) {
    let file = this.files.get(path) as ExistingFile,
      build: Build = (file.build = { output: {}, dependencies: new Set() });

    // Output
    let { diagnostics } = this.builder.emit(file.source, (outPath, text) => {
      if (endsWith(outPath, ".js")) build.output.code = text;
      else if (endsWith(outPath, ".js.map")) build.output.codeMap = text;
      else if (endsWith(outPath, ".d.ts")) build.output.declaration = text;
      else if (endsWith(outPath, ".d.ts.map")) build.output.declarationMap = text;
      else if (endsWith(outPath, ".json")) build.output.json = text;
    });
    if (diagnostics) this.plugin.diagnostics.print(diagnostics);

    // Dependencies
    let references = this.builder.getState().referencedMap!.getValues(file.source.resolvedPath);
    if (references) {
      let iterator = references.keys();
      for (let next = iterator.next(); !next.done; next = iterator.next()) build.dependencies.add(next.value);
    }

    return build;
  }

  private deleteFile(path: string) {
    this.files.delete(path);
    this.filesByType.json.delete(path);
    this.filesByType.declaration.delete(path);
  }

  private isBuilderUpToDate() {
    let program = this.builder?.getProgramOrUndefined();
    if (!program) return false;

    // Compiler options
    if (!compareObjects(program.getCompilerOptions(), this.plugin.config.options)) return false;

    // Source files
    let oldSourceFiles = program.getSourceFiles();
    if (oldSourceFiles.some(source => source.version !== this.getSourceVersion(source.resolvedPath))) return false;

    // Root files
    if (!compareArrays(program.getRootFileNames(), this.plugin.config.rootFileNames)) return false;

    // Missing files
    if (program.getMissingFilePaths().some(fileExists)) return false;

    return true;
  }
}
