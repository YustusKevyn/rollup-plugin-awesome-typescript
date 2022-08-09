import type { Plugin } from "..";

import { normalizeCase } from "../../util/path";
import { directoryExists } from "../../util/fs";
import { mkdirSync, writeFileSync } from "fs";
import { dirname, join, relative } from "path";

export class Emitter {
  constructor(private plugin: Plugin) {}

  emit(files: Set<string>) {
    this.emitBuildInfo();
  }

  emitBuildInfo() {
    let { diagnostics } = this.plugin.program.builder.emitBuildInfo((path, text) => writeFileSync(path, text, "utf-8"));
    if (diagnostics) this.plugin.logger.diagnostics.print(diagnostics);
  }
}
