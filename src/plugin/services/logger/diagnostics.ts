import type { Logger } from ".";
import type { Plugin } from "../..";
import type { Properties } from "./types";
import type { Diagnostic } from "typescript";

export class Diagnostics {
  constructor(private logger: Logger, private plugin: Plugin) {}

  print(diagnostics: Diagnostic | Diagnostic[]) {}
}
