import type { Plugin } from "..";

import { intersection } from "../../util/data";

export class Files {
  public scripts!: Set<string>;
  public configs!: Set<string>;

  constructor(private plugin: Plugin) {}

  public get declarations() {
    return intersection(this.scripts, this.plugin.program.filesByType.declaration);
  }

  public init() {
    this.update();
  }

  public isSource(path: string) {
    return this.scripts.has(path) || this.plugin.program.filesByType.json.has(path);
  }

  public update() {
    this.updateScripts();
    this.configs = new Set(this.plugin.config.configFileNames.map(id => this.plugin.resolver.toPath(id)));
  }

  public updateScripts() {
    this.scripts = new Set(this.plugin.config.rootFileNames.map(id => this.plugin.resolver.toPath(id)));
  }
}
