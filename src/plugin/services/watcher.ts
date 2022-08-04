import type { Plugin } from "..";
import type { ChangeEvent } from "rollup";

export class Watcher {
  private pending: Map<string, ChangeEvent> = new Map();

  constructor(private plugin: Plugin) {}

  public register(id: string, event: ChangeEvent) {
    let path = this.plugin.resolver.toPath(id);
    this.pending.set(path, event);
  }

  public process() {
    if (!this.pending.size) return;
    let pending = this.pending;
    this.pending = new Map();

    // Config
    let config = this.plugin.config;
    if (pending.has(config.path) || config.extends.some(path => pending.has(path))) config.update();

    // Program
    for (let [path, event] of pending) {
      if (event === "delete") this.plugin.program.removeFile(path);
      else if (this.plugin.filter.includes(path)) this.plugin.program.updateFile(path);
    }
  }
}
