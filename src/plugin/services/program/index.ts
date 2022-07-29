import type { Plugin } from "../..";
import type { File } from "./types";
import type { CompilerHost, EmitAndSemanticDiagnosticsBuilderProgram } from "typescript";

import { existsFile } from "../../util/fs";
import { readFileSync } from "fs";

export class Program {
  private files: Map<string, File> = new Map();

  private host: CompilerHost;
  private instance: EmitAndSemanticDiagnosticsBuilderProgram;

  constructor(private plugin: Plugin) {
    this.host = this.createHost();
    this.instance = this.createProgram();
  }

  private createFile(id: string) {
    let logger = this.plugin.logger,
      compiler = this.plugin.compiler.instance,
      path = compiler.toPath(id, this.plugin.cwd, this.plugin.compiler.getCanonicalFileName);

    if (!existsFile(path)) return null;

    let data: string;
    try {
      data = readFileSync(path, "utf-8");
    } catch {
      logger.error({ message: "Failed to read file.", path });
      return null;
    }

    // ---- TEMP ----
    let kind = compiler.ScriptKind.TS,
      target = compiler.ScriptTarget.ESNext;
    // --------------

    let file: File = {
      input: {
        kind,
        target,
        source: compiler.createSourceFile(id, data, target, true, kind),
        version: new Date().getTime()
      }
    };

    this.files.set(path, file);
    return file;
  }

  private createHost(): CompilerHost {
    let compiler = this.plugin.compiler.instance;
    return {
      fileExists: compiler.sys.fileExists,
      getCanonicalFileName: this.plugin.compiler.getCanonicalFileName,
      getCurrentDirectory: () => this.plugin.cwd,
      getDefaultLibFileName: compiler.getDefaultLibFilePath,
      getNewLine: () => compiler.sys.newLine,
      getSourceFile,
      getSourceFileByPath,
      readFile: compiler.sys.readFile,
      useCaseSensitiveFileNames: () => compiler.sys.useCaseSensitiveFileNames,
      writeFile: (...args) => console.log(args),
      createHash: compiler.sys.createHash,
      directoryExists: compiler.sys.directoryExists,
      getDirectories: compiler.sys.getDirectories,
      getModuleResolutionCache: () => this.plugin.resolver.cache,
      readDirectory: compiler.sys.readDirectory,
      realpath: compiler.sys.realpath,
      resolveModuleNames: (ids, origin) => ids.map(id => this.plugin.resolver.resolve(id, origin))
    };
  }

  private createProgram() {
    return this.plugin.compiler.instance.createEmitAndSemanticDiagnosticsBuilderProgram(
      Array.from(this.files.keys()),
      this.plugin.config.options,
      this.host,
      this.instance
    );
  }
}
