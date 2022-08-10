import type { Plugin } from "..";
import type { ChangeEvent } from "rollup";

import { some } from "../../util/data";

export class Watcher {
  private pending: Map<string, ChangeEvent> = new Map();

  constructor(private plugin: Plugin) {}

  public register(id: string, event: ChangeEvent) {
    let path = this.plugin.resolver.toPath(id);
    this.pending.set(path, event);
  }

  public update() {
    if (!this.pending.size) return;
    let pending = this.pending;
    this.pending = new Map();

    // Config
    let config = this.plugin.config;
    if (some(this.plugin.files.configs, path => pending.has(path))) config.update();
    else config.updateRootFiles();

    // Program
    for (let [path, event] of pending) {
      if (event === "delete") this.plugin.program.removeFile(path);
      else if (this.plugin.files.isSource(path)) this.plugin.program.updateFile(path);
    }
    this.plugin.program.update();
  }
}
