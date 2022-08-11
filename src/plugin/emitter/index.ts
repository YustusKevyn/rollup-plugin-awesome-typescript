import type { Plugin } from "..";

import { writeFileSync } from "fs";

export class Emitter {
  constructor(private plugin: Plugin) {}

  public init() {}

  public emit(files: Set<string>) {
    this.emitBuildInfo();
  }

  public emitBuildInfo() {
    let { diagnostics } = this.plugin.program.builder.emitBuildInfo((path, text) => writeFileSync(path, text, "utf-8"));
    if (diagnostics) this.plugin.diagnostics.print(diagnostics);
  }
}
