import type { Plugin } from "..";

export class Filter {
  constructor(private plugin: Plugin) {}

  includes(path: string) {
    return this.plugin.config.files.includes(path);
  }
}
