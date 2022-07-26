import type { Plugin } from "..";
import type typescript from "typescript";

export class Compiler {
  readonly file: string;
  readonly instance: typeof typescript;

  constructor(private plugin: Plugin, input: string) {
    this.file = this.find(input);
    this.instance = require(this.file);
  }

  find(input: string) {
    return "";
  }
}
