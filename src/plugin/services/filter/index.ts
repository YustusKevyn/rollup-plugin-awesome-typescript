import type { Plugin } from "../..";
import type { State } from "./types";

export class Filter {
  private state!: State;

  constructor(private plugin: Plugin) {
    this.load();
  }

  public get files() {
    return this.state.files;
  }

  public get configs() {
    return this.state.configs;
  }

  private load() {
    let { rootFiles, configFiles } = this.plugin.config;
    this.state = {
      files: new Set(rootFiles.map(id => this.plugin.resolver.toPath(id))),
      configs: new Set(configFiles.map(id => this.plugin.resolver.toPath(id)))
    };
  }

  public update() {
    this.load();
  }

  public updateFiles() {
    this.state.files = new Set(this.plugin.config.rootFiles.map(id => this.plugin.resolver.toPath(id)));
  }
}
