import type { Plugin } from "..";

export class Filter {
  private files!: Set<string>;

  constructor(private plugin: Plugin) {
    this.load();
  }

  public includes(path: string) {
    return this.files.has(path);
  }

  private load() {
    this.files = new Set(this.plugin.config.rootFiles.map(id => this.plugin.resolver.toPath(id)));
  }

  public update() {
    this.load();
  }
}
