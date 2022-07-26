import type { Plugin } from "../..";

import { Language } from "./language";

export class Program {
  private language: Language;

  constructor(private plugin: Plugin) {
    this.language = new Language(this, plugin);
  }
}
