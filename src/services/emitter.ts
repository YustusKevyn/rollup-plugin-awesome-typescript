import type { Plugin } from "../plugin";

import { mkdirSync, writeFileSync } from "fs";
import { dirname, join, relative } from "path";
import { intersection } from "../util/data";
import { isSubPath, normaliseCase } from "../util/path";
import { directoryExists } from "../util/fs";

export class Emitter {
  readonly declarations = {
    all: true,
    pending: new Set() as Set<string>
  };

  constructor(private plugin: Plugin) {}

  public emit(files: Set<string>) {
    this.emitBuildInfo();
    this.emitDeclarations(files);
    this.clear();
  }

  private emitBuildInfo() {
    let writeFile = (path: string, text: string) => writeFileSync(path, text, "utf-8");
    this.plugin.program.instance.emitBuildInfo(writeFile);
  }

  private emitDeclarations(files: Set<string>) {
    let { declarations, options } = this.plugin.config.store;
    if (!declarations) return;

    let compiler = this.plugin.compiler.instance,
      rootDir = options.rootDir;
    if (!rootDir)
      rootDir = compiler.computeCommonSourceDirectoryOfFilenames(Array.from(files), this.plugin.cwd, normaliseCase);
    if (!this.declarations.all) files = intersection(files, this.declarations.pending);

    for (let path of files) {
      let output = this.plugin.builder.getDeclaration(path);
      if (!output) continue;

      let outPath = join(declarations, relative(rootDir, compiler.removeFileExtension(path)));
      if (!isSubPath(outPath, declarations)) continue;

      let outDir = dirname(outPath);
      if (!directoryExists(outDir)) mkdirSync(outDir, { recursive: true });
      writeFileSync(outPath + ".d.ts", output.text, "utf-8");
      if (output.map) writeFileSync(outPath + ".d.ts.map", output.map, "utf-8");
    }
  }

  private clear() {
    this.declarations.all = false;
    this.declarations.pending.clear();
  }
}
