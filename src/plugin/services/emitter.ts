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
    let logger = this.plugin.logger,
      emit = this.plugin.config.options.declaration,
      declarationDir = this.plugin.config.options.declarationDir;

    if (!emit || !declarationDir) {
      if (emit && !declarationDir)
        logger.warn({
          message:
            'Skipping the output of declaration files. Although "declaration" is set to `true` in the TSConfig, no output directory was specified.',
          description: 'Specify "declarationDir" in the TSConfig or "declarations" in the plugin options.'
        });
      return;
    }

    let compiler = this.plugin.compiler.instance,
      rootDir = this.plugin.config.options.rootDir;
    if (!rootDir)
      rootDir = compiler.computeCommonSourceDirectoryOfFilenames(Array.from(files), this.plugin.cwd, normalizeCase);

    for (let path of files) {
      let output = this.plugin.program.getOutput(path);
      if (!output?.declaration) continue;

      let outPath = join(declarationDir, relative(rootDir, compiler.removeFileExtension(path))),
        outDir = dirname(outPath);

      if (!directoryExists(outDir)) mkdirSync(outDir, { recursive: true });
      writeFileSync(outPath + ".d.ts", output.declaration, "utf-8");
      if (output.declarationMap) writeFileSync(outPath + ".d.ts.map", output.declaration, "utf-8");
    }
  }

  private emitBuildInfo() {
    //   console.time();
    //   let buildInfo = this.plugin.program.getBuildInfo();
    //   console.timeEnd();
    //   if (buildInfo) writeFileSync(this.plugin.config.options.tsBuildInfoFile!, buildInfo, "utf-8");
  }
}
