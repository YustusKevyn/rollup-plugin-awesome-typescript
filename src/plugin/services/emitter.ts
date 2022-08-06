import type { Plugin } from "..";

import { dirname, join, relative } from "path";
import { mkdirSync, writeFileSync } from "fs";
import { normalizeCase } from "../util/path";
import { directoryExists } from "../util/fs";

export class Emitter {
  constructor(private plugin: Plugin) {}

  public emit(files: Set<string>) {
    this.emitDelcarations(files);
    this.emitBuildInfo();
  }

  private emitDelcarations(files: Set<string>) {
    let { declaration, declarationDir, rootDir } = this.plugin.config.options;
    if (!declaration || !declarationDir) return;

    let compiler = this.plugin.compiler.instance;
    if (!rootDir)
      rootDir = compiler.computeCommonSourceDirectoryOfFilenames(Array.from(files), this.plugin.cwd, normalizeCase);

    for (let path of files) {
      let output = this.plugin.program.getOutput(path);
      if (!output?.declaration) continue;

      let outPath = join(declarationDir, relative(rootDir, compiler.removeFileExtension(path)));
      if (!outPath.startsWith(declarationDir)) continue;

      let outDir = dirname(outPath);
      if (!directoryExists(outDir)) mkdirSync(outDir, { recursive: true });
      writeFileSync(outPath + ".d.ts", output.declaration, "utf-8");
      if (output.declarationMap) writeFileSync(outPath + ".d.ts.map", output.declaration, "utf-8");
    }
  }

  private emitBuildInfo() {
    this.plugin.program.builder.emitBuildInfo((path, text) => {
      writeFileSync(path, text, "utf-8");
    });
  }
}
