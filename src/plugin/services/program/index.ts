import type { Plugin } from "../..";
import type { File } from "./types";
import type { CompilerHost as Host, Program as Instance, SourceFile } from "typescript";

import { readFileSync } from "fs";

export class Program {
  private files: Map<string, File> = new Map();

  private host: Host;
  private instance: Instance;

  constructor(private plugin: Plugin) {
    this.host = this.createHost();
  }

  private synchronize() {
    let compiler = this.plugin.compiler.instance;

    let a: SourceFile;
    a.version;

    // files = Object.keys(this.files);
  }

  private getFile(id: string) {
    return this.files.get(id) ?? this.createFile(id);
  }

  private getInput(id: string) {
    return this.getFile(id).input ?? this.createInput(id);
  }

  private createFile(id: string) {
    let file: File = { path: id };
    this.files.set(id, file);
    return file;
  }

  private createInput(id: string, data?: string) {
    let file = this.getFile(id);
    if (!data) data = readFileSync(file.path, "utf-8");

    let compiler = this.plugin.compiler.instance;

    // REPLACE THIS!!
    let kind = compiler.ScriptKind.TS,
      target = compiler.ScriptTarget.ESNext;
    // ---

    return (file.input = {
      kind,
      source: compiler.createSourceFile(id, data, target, false, kind),
      version: 0,
      snapshot: this.plugin.compiler.instance.ScriptSnapshot.fromString(data)
    });
  }

  private createHost(): Host {
    let compiler = this.plugin.compiler.instance;
    return {
      fileExists: compiler.sys.fileExists,
      getCanonicalFileName: this.plugin.compiler.getCanonicalFileName,
      getCurrentDirectory: () => this.plugin.cwd,
      getDefaultLibFileName: compiler.getDefaultLibFilePath,
      getNewLine: () => compiler.sys.newLine,
      getSourceFile: (id) => this.getInput(id).source,
      readFile: compiler.sys.readFile,
      useCaseSensitiveFileNames: () => compiler.sys.useCaseSensitiveFileNames,
      writeFile: compiler.sys.writeFile,
      createHash: compiler.sys.createHash,
      directoryExists: compiler.sys.directoryExists,
      getDirectories: compiler.sys.getDirectories,
      getModuleResolutionCache: () => this.plugin.resolver.cache
    };
  }

  public updateInput(id: string, data: string) {
    let input = this.getFile(id).input;
    if (!input) return this.createInput(id);

    let compiler = this.plugin.compiler.instance,
      snapshot = compiler.ScriptSnapshot.fromString(data);
    input.version++;
    input.source = compiler.updateSourceFile(input.source, data, snapshot.getChangeRange(input.snapshot)!);
    input.snapshot = snapshot;
    return input;
  }
}
