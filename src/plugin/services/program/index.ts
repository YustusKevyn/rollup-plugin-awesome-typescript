import type { Plugin } from "../..";
import type { ExistingFile, File, Output } from "./types";
import type { CompilerHost, EmitAndSemanticDiagnosticsBuilderProgram } from "typescript";

import { compare } from "../../util/object";
import { fileExists } from "../../util/fs";
import { readFileSync } from "fs";
import { normalizeCase } from "../../util/path";

export enum FileKind {
  Missing,
  Existing
}

export class Program {
  private files: Map<string, File> = new Map();

  private host: CompilerHost;
  private builder: EmitAndSemanticDiagnosticsBuilderProgram;

  constructor(private plugin: Plugin) {
    this.host = this.createHost();
    this.builder = this.createBuilder();
  }

  private getFile(path: string) {
    return this.files.get(path) ?? this.createFile(path);
  }

  private createFile(path: string) {
    let data = this.getData(path),
      version = new Date().getTime(),
      file: File;

    if (data === null) file = { kind: FileKind.Missing, version };
    else {
      let source = this.plugin.compiler.instance.createSourceFile(path, data, this.plugin.config.target);
      source.version = version.toString();
      file = { kind: FileKind.Existing, version, source };
    }

    this.files.set(path, file);
    return file;
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

    this.files.set(path, file);
    return file;
  }

  private compileFile(path: string) {
    let file = this.files.get(path) as ExistingFile;

    // Output
    let output: Output = {},
      writeFile = (path: string, text: string) => {
        if (path.endsWith(".js")) output.code = text;
        else if (path.endsWith(".js.map")) output.codeMap = text;
        else if (path.endsWith(".d.ts")) output.declaration = text;
        else if (path.endsWith(".d.ts.map")) output.declarationMap = text;
      };

    // Diagnostics
    let { diagnostics } = this.builder.emit(file.source, writeFile);
    if (diagnostics) this.plugin.logger.diagnostics.print(diagnostics);

    // Save
    return (file.build = { output });
  }

  public removeFile(path: string) {
    let file = this.files.get(path);
    if (!file) return;
    this.files.set(path, { kind: FileKind.Missing, version: new Date().getTime() });
  }

  private deleteFile(path: string) {
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

  public getOutput(path: string) {
    let file = this.getFile(path);
    if (file.kind !== FileKind.Existing) return null;
    if (file.build) return file.build.output;
    return this.compileFile(path).output;
  }

  public getDependencies(path: string) {
    let file = this.getFile(path),
      dependencies: Set<string> = new Set();
    if (file.kind !== FileKind.Existing) return dependencies;
    if (!file.build) this.compileFile(path);

    let state = this.builder.getState(),
      references = state.referencedMap!.getValues(file.source.resolvedPath);
    if (!references) return dependencies;

    let iterator = references.keys();
    for (let next = iterator.next(); !next.done; next = iterator.next()) {
      if (this.plugin.filter.includes(next.value)) dependencies.add(next.value);
    }
    return dependencies;
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
      useCaseSensitiveFileNames: () => compiler.sys.useCaseSensitiveFileNames,
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
    return this.plugin.compiler.instance.createEmitAndSemanticDiagnosticsBuilderProgram(
      this.plugin.config.rootFiles,
      this.plugin.config.options,
      this.host,
      this.builder,
      undefined,
      this.plugin.config.references
    );
  }

  private isBuilderUpToDate() {
    let program = this.builder.getProgramOrUndefined();
    if (!program) return false;

    // Compiler options
    if (!compare(program.getCompilerOptions(), this.plugin.config.options)) return false;

    // Source files
    let oldSourceFiles = program.getSourceFiles();
    if (oldSourceFiles.some(source => source.version !== this.getSourceVersion(source.resolvedPath))) return false;

    // Root files
    let oldRootFiles = program.getRootFileNames(),
      newRootFiles = this.plugin.config.rootFiles;
    if (oldRootFiles.length !== newRootFiles.length) return false;
    if (oldRootFiles.some(id => !newRootFiles.includes(id))) return false;

    // Missing files
    if (program.getMissingFilePaths().some(fileExists)) return false;

    return true;
  }

  public update() {
    while (this.builder.getSemanticDiagnosticsOfNextAffectedFile());
    if (!this.isBuilderUpToDate()) this.builder = this.createBuilder();
  }

  public check(files: Set<string>) {
    let syntacticDiagnostics = [],
      semanticDiagnostics = [];
    for (let path of files) {
      let source = this.getSource(path);
      if (!source) continue;

      syntacticDiagnostics.push(...this.builder.getSyntacticDiagnostics(source));
      semanticDiagnostics.push(...this.builder.getSemanticDiagnostics(source));
    }

    let logger = this.plugin.logger;
    logger.diagnostics.print(syntacticDiagnostics);
    logger.diagnostics.print(semanticDiagnostics);
  }

  // public getBuildInfo() {
  //   let buildInfo: string | undefined,
  //     { diagnostics } = this.builder.getProgram().emitBuildInfo((path, text) => (buildInfo = text));
  //   if (diagnostics) this.plugin.logger.diagnostics.print(diagnostics);
  //   return buildInfo;
  // }
}
