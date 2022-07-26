import type { Plugin } from "../..";
import type { Properties } from "./types";

import { Level } from "./constants";
import { Diagnostics } from "./diagnostics";

export class Logger {
  readonly diagnostics: Diagnostics;

  constructor(private plugin: Plugin, readonly level: Level) {
    this.diagnostics = new Diagnostics(this, plugin);
  }

  error(props: Properties | string) {
    if (typeof props === "string") props = { message: props };
  }

  message(props: Properties | string) {
    if (typeof props === "string") props = { message: props };
  }

  info(props: Properties | string) {
    if (typeof props === "string") props = { message: props };
  }

  debug(props: Properties | string) {
    if (typeof props === "string") props = { message: props };
  }
}

export { Level as LogLevel };
