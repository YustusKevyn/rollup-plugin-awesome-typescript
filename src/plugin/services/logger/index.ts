import type { Plugin } from "../..";
import type { Position, Properties } from "./types";

import { Diagnostics } from "./diagnostics";

import { apply } from "../../util/ansi";
import { relative } from "path";

export enum LogLevel {
  Error,
  Warn,
  Info,
  Debug
}

export class Logger {
  readonly diagnostics: Diagnostics;

  readonly newLine = "\n";

  constructor(private plugin: Plugin, readonly level: LogLevel) {
    this.diagnostics = new Diagnostics(this, plugin);
  }

  error(props: Properties | string) {
    if (this.level < LogLevel.Error) return;
    if (typeof props === "string") props = { message: props };

    let final = apply(" ERROR ", "brightWhite", "bgRed", "bold");
    if (props.prefix) final += apply(" " + props.prefix + " ", "bgGrey", "white");
    final += " " + apply(props.message, "red", "bold");
    final += this.formatBody(props, 8);
    console.log(final);
  }

  warn(props: Properties | string) {
    if (this.level < LogLevel.Warn) return;
    if (typeof props === "string") props = { message: props };

    let final = apply(" WARN ", "brightWhite", "bgYellow", "bold");
    if (props.prefix) final += apply(" " + props.prefix + " ", "bgGrey", "white");
    final += " " + apply(props.message, "yellow", "bold");
    final += this.formatBody(props, 7);
    console.log(final);
  }

  info(props: Properties | string) {
    if (this.level < LogLevel.Info) return;
    if (typeof props === "string") props = { message: props };

    let final = "";
    if (props.prefix) final += apply(props.prefix + " ", "grey");
    final += props.message;
    final += this.formatBody(props);
    console.log(final);
  }

  debug(props: Properties | string) {
    if (this.level < LogLevel.Debug) return;
    if (typeof props === "string") props = { message: props };

    let final = "";
    if (props.prefix) final += apply(props.prefix + " ", "grey");
    final += props.message;
    final += this.formatBody(props);
    console.log(apply(final, "dim"));
  }

  formatPath(path: string) {
    return apply(relative(this.plugin.cwd, path), "cyan", "underline");
  }

  private formatLocation(location: string, position?: Position) {
    let final = "at " + this.formatPath(location);
    if (position) {
      final += ":" + apply(position.line, "yellow");
      final += ":" + apply(position.character, "yellow");
    }
    return final;
  }

  private formatBody(props: Properties, indentation: number = 0) {
    let final = "",
      next = this.newLine + " ".repeat(indentation);

    // Location
    if (props.location) final += next + this.formatLocation(props.location, props.position);

    // Snippet
    if (props.snippet) {
      let snippet = typeof props.snippet === "string" ? props.snippet.split("\n") : props.snippet;
      final += this.newLine + next + snippet.join(next) + this.newLine;
    }

    return final;
  }
}
