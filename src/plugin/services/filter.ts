import type { Plugin } from "..";

export class Filter {
  public json: Set<string> = new Set();
  public roots: Set<string> = new Set();
  public configs: Set<string> = new Set();
  public declarations: Set<string> = new Set();

  constructor(private plugin: Plugin) {}

  public isModule(path: string) {
    return this.roots.has(path) || this.json.has(path);
  }
}
