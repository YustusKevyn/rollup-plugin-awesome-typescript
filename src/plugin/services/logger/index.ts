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

  public error(props: Properties | string) {
    if (this.level < LogLevel.Error) return;
    if (typeof props === "string") props = { message: props };

    let final = apply(" ERROR ", "brightWhite", "bgRed", "bold");
    if (props.prefix) final += apply(" " + props.prefix + " ", "bgGrey", "white");
    final += " " + apply(props.message, "red", "bold");
    final += this.formatBody(props, props.indentation ?? 8);
    console.log(final);
  }

  public warn(props: Properties | string) {
    if (this.level < LogLevel.Warn) return;
    if (typeof props === "string") props = { message: props };

    let final = apply(" WARN ", "brightWhite", "bgYellow", "bold");
    if (props.prefix) final += apply(" " + props.prefix + " ", "bgGrey", "white");
    final += " " + apply(props.message, "yellow", "bold");
    final += this.formatBody(props, props.indentation ?? 7);
    console.log(final);
  }

  public info(props: Properties | string) {
    if (this.level < LogLevel.Info) return;
    if (typeof props === "string") props = { message: props };

    let final = " • ";
    if (props.prefix) final += apply(props.prefix + " ", "grey");
    final += props.message;
    final += this.formatBody(props, props.indentation ?? 3);
    console.log(final);
  }

  public debug(props: Properties | string) {
    if (this.level < LogLevel.Debug) return;
    if (typeof props === "string") props = { message: props };

    let final = "";
    if (props.prefix) final += apply(props.prefix + " ", "grey");
    final += props.message;
    final += this.formatBody(props, props.indentation ?? 0);
    console.log(apply(final, "dim"));
  }

  public formatPath(path: string) {
    return apply(relative(this.plugin.cwd, path), "cyan", "underline");
  }

  private formatLocation(path: string, position?: Position) {
    let final = "at " + this.formatPath(path);
    if (position) {
      final += ":" + apply(position.line, "yellow");
      final += ":" + apply(position.character, "yellow");
    }
    return final;
  }

  private formatBody(props: Properties, indentation: number) {
    let final = "",
      next = this.newLine + " ".repeat(indentation);

    // Location
    if (props.path) final += next + this.formatLocation(props.path, props.position);

    // Description
    if (props.description) {
      let description = typeof props.description === "string" ? props.description.split("\n") : props.description;
      final += next + apply(description.join(next), "grey");
    }

    // Snippet
    if (props.snippet) {
      let snippet = typeof props.snippet === "string" ? props.snippet.split("\n") : props.snippet;
      final += this.newLine + next + snippet.join(next) + this.newLine;
    }

    return final;
  }
}
