import type { Plugin } from "..";

export enum WatcherEventKind {
  Created,
  Changed,
  Removed
}

export class Watcher {
  private pending: Map<string, WatcherEventKind> = new Map();

  constructor(private plugin: Plugin) {}

  public queue(id: string, event: WatcherEventKind) {
    let path = this.plugin.resolver.toPath(id);
    this.pending.set(path, event);
  }

  public flush() {
    let pending = this.pending;
    this.pending = new Map();

    for (let path of pending.keys()) {
      let event = pending.get(path);
      if (event === WatcherEventKind.Removed) this.plugin.program.removeFile(path);
      else if (this.plugin.filter.includes(path)) this.plugin.program.updateFile(path);
    }
  }
}
