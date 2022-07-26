import type { Program } from ".";
import type { LanguageService, LanguageServiceHost } from "typescript";
import type { Plugin } from "../..";

export class Language {
  readonly host: LanguageServiceHost;
  readonly service: LanguageService;

  constructor(private program: Program, private plugin: Plugin) {}
}
