import type { Plugin } from "../..";
import type { Build, ExistingFile, File, Output } from "./types";
import type { CompilerHost, SemanticDiagnosticsBuilderProgram } from "typescript";

import { readFileSync } from "fs";
import { normalizeCase } from "../../../util/path";
import { fileExists, isCaseSensitive } from "../../../util/fs";
import { compareArrays, compareObjects } from "../../../util/data";

export enum FileKind {
  Missing,
  Existing
}

export class Program {
  private files: Map<string, File> = new Map();

  private host: CompilerHost;
  public builder!: SemanticDiagnosticsBuilderProgram;

  readonly declarations: Set<string> = new Set();

  constructor(private plugin: Plugin) {
    this.host = this.createHost();
    this.update();
  }

  private setFile(path: string, file: File) {
    this.files.set(path, file);
    return file;
  }

  private getFile(path: string) {
    return this.files.get(path) ?? this.createFile(path);
  }

  private createFile(path: string) {
    let compiler = this.plugin.compiler.instance,
      data = this.getData(path),
      version = new Date().getTime(),
      file: File;

    if (compiler.isDeclarationFileName(path)) this.declarations.add(path);

    if (data === null) file = { kind: FileKind.Missing, version };
    else {
      let source = compiler.createSourceFile(path, data, this.plugin.config.target);
      source.version = version.toString();
      file = { kind: FileKind.Existing, version, source };
    }
    return this.setFile(path, file);
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

  private buildFile(path: string) {
    let file = this.files.get(path) as ExistingFile,
      build: Build = (file.build = { output: {}, dependencies: new Set() });

    // Output
    let { diagnostics } = this.builder.emit(file.source, (outPath, text) => {
      if (outPath.endsWith(".js")) build.output.code = text;
      else if (outPath.endsWith(".js.map")) build.output.codeMap = text;
      else if (outPath.endsWith(".d.ts")) build.output.declaration = text;
      else if (outPath.endsWith(".d.ts.map")) build.output.declarationMap = text;
    });
    if (diagnostics) this.plugin.logger.diagnostics.print(diagnostics);

    // Dependencies
    let references = this.builder.getState().referencedMap!.getValues(file.source.resolvedPath);
    if (references) {
      let iterator = references.keys();
      for (let next = iterator.next(); !next.done; next = iterator.next()) build.dependencies.add(next.value);
    }

    return build;
  }

  public removeFile(path: string) {
    let file = this.files.get(path);
    if (!file) return;
    return this.setFile(path, { kind: FileKind.Missing, version: new Date().getTime() });
  }

  private deleteFile(path: string) {
    this.declarations.delete(path);
    this.files.delete(path);
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

  public getBuild(path: string) {
    let file = this.getFile(path);
    if (file.kind !== FileKind.Existing) return null;
    if (file.build) return file.build;
    return this.buildFile(path);
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
      this.plugin.config.rootFiles,
      this.plugin.config.options,
      this.host,
      this.builder,
      undefined,
      this.plugin.config.references
    );
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
    if (!compareArrays(program.getRootFileNames(), this.plugin.config.rootFiles)) return false;

    // Missing files
    if (program.getMissingFilePaths().some(fileExists)) return false;

    return true;
  }

  public update() {
    if (!this.isBuilderUpToDate()) this.builder = this.createBuilder();
    while (this.builder.getSemanticDiagnosticsOfNextAffectedFile());
  }
}
