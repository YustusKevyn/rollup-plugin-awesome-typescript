import type { Plugin } from "..";
import type { File } from "../types";
import type { CompilerHost, SemanticDiagnosticsBuilderProgram } from "typescript";

import { FileKind } from "../constants";
import { readFileSync } from "fs";
import { normaliseCase } from "../../util/path";
import { fileExists, isCaseSensitive } from "../../util/fs";
import { compareArrays, compareObjects, endsWith } from "../../util/data";

export class Program {
  public host!: CompilerHost;
  public instance!: SemanticDiagnosticsBuilderProgram;

  private files: Map<string, File> = new Map();

  constructor(private plugin: Plugin) {}

  public init() {
    this.host = this.createHost();
    this.update();
  }

  public update() {
    if (!this.isUpToDate()) this.instance = this.createInstance();
    while (this.instance.getSemanticDiagnosticsOfNextAffectedFile());
  }

  private isUpToDate() {
    let program = this.instance?.getProgramOrUndefined();
    if (!program) return false;

    // Compiler options
    if (!compareObjects(program.getCompilerOptions(), this.plugin.config.store.options)) return false;

    // Source files
    let oldSourceFiles = program.getSourceFiles();
    if (oldSourceFiles.some(source => source.version !== this.getSourceVersion(source.resolvedPath))) return false;

    // Root files
    if (!compareArrays(program.getRootFileNames(), Array.from(this.plugin.filter.roots.keys()))) return false;

    // Missing files
    if (program.getMissingFilePaths().some(fileExists)) return false;

    return true;
  }

  private getFile(path: string) {
    return this.files.get(path) ?? this.createFile(path);
  }

  private getData(path: string) {
    if (!fileExists(path)) return null;
    try {
      return readFileSync(path, "utf-8");
    } catch {
      this.plugin.tracker.recordError({ message: "Failed to read file.", path });
      return null;
    }
  }

  public getSource(path: string) {
    let file = this.getFile(path);
    return file.kind !== FileKind.Missing ? file.source : undefined;
  }

  private getSourceVersion(path: string) {
    let file = this.files.get(path);
    return file?.kind !== FileKind.Existing ? undefined : file.source.version;
  }

  private setFile(path: string, file: File) {
    this.files.set(path, file);
    this.plugin.builder.invalidateBuild(path);
    return file;
  }

  private createFile(path: string) {
    let compiler = this.plugin.compiler.instance,
      data = this.getData(path),
      version = new Date().getTime(),
      file: File;

    if (endsWith(path, ".json")) this.plugin.filter.json.add(path);
    else if (endsWith(path, ".d.ts", ".d.mts", ".d.cts")) this.plugin.filter.declarations.add(path);

    if (data === null) file = { kind: FileKind.Missing, version };
    else {
      let source = compiler.createSourceFile(path, data, this.plugin.config.store.target);
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
      let source = this.plugin.compiler.instance.createSourceFile(path, data, this.plugin.config.store.target);
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

  private deleteFile(path: string) {
    this.files.delete(path);
    this.plugin.builder.invalidateBuild(path);
    this.plugin.filter.json.delete(path);
    this.plugin.filter.declarations.delete(path);
  }

  private createHost(): CompilerHost {
    let compiler = this.plugin.compiler.instance;
    return {
      fileExists: compiler.sys.fileExists,
      getCanonicalFileName: normaliseCase,
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

  private createInstance() {
    return this.plugin.compiler.instance.createSemanticDiagnosticsBuilderProgram(
      Array.from(this.plugin.filter.roots.keys()),
      this.plugin.config.store.options,
      this.host,
      this.instance,
      undefined,
      this.plugin.config.store.references
    );
  }
}
