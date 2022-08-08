import type { Plugin } from "..";

import { writeFileSync } from "fs";

export class Emitter {
  constructor(private plugin: Plugin) {}

  public emit(files: Set<string>) {
    this.emitBuildInfo();
  }

  private emitBuildInfo() {
    this.plugin.program.builder.emitBuildInfo((path, text) => writeFileSync(path, text, "utf-8"));
  }
}
