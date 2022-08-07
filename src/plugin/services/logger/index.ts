import type { Plugin } from "../..";
import type { Position, Record } from "./types";

import { Diagnostics } from "./diagnostics";

import { apply } from "../../../util/ansi";
import { relative } from "path";

enum Level {
  Error,
  Warn,
  Info,
  Debug
}

export class Logger {
  readonly diagnostics: Diagnostics;

  readonly newLine = "\n";
  readonly padding = "";

  constructor(private plugin: Plugin, readonly level: Level) {
    this.diagnostics = new Diagnostics(this, plugin);
  }

  public log(arg: string | string[], level: Level) {
    if (this.level < level && level !== Level.Error) return;
    if (typeof arg === "string") arg = arg.split("\n");
    console.log(arg.join(this.newLine));
  }

  public error(record: Record | string) {
    if (typeof record === "string") record = { message: record };

    let final = this.newLine;
    final += this.formatHeader(
      record,
      apply(" ERROR ", "brightWhite", "bgRed", "bold"),
      apply(record.message, "red", "bold")
    );
    final += this.formatBody(record, 8) + this.newLine;
    console.log(final);
  }

  public warn(record: Record | string) {
    if (this.level < Level.Warn) return;
    if (typeof record === "string") record = { message: record };

    let final = this.newLine;
    final += this.formatHeader(
      record,
      apply(" WARN ", "brightWhite", "bgYellow", "bold"),
      apply(record.message, "yellow", "bold")
    );
    final += this.formatBody(record, 7) + this.newLine;
    console.log(final);
  }

  public info(record: Record | string) {
    if (this.level < Level.Info) return;
    if (typeof record === "string") record = { message: record };

    let final = this.newLine;
    final += this.formatHeader(
      record,
      apply(" INFO ", "brightWhite", "bgCyan", "bold"),
      apply(record.message, "cyan", "bold")
    );
    final += this.formatBody(record, 7) + this.newLine;
    console.log(final);
  }

  public applyIndentation(arg: string | string[], indentation: number) {
    if (typeof arg === "string") arg = arg.split("\n");
    if (!indentation) return arg.join(this.newLine);
    return arg.map(line => " ".repeat(indentation) + line).join(this.newLine);
  }

  public formatPath(path: string) {
    return apply(relative(this.plugin.cwd, path), "cyan", "underline");
  }

  private formatLocation(path: string, position?: Position) {
    let final = "at " + this.formatPath(path);
    if (position) {
      final += ":" + apply(position.line + 1, "yellow");
      final += ":" + apply(position.character + 1, "yellow");
    }
    return final;
  }

  private formatHeader(record: Record, prefix: string, title: string) {
    let final = prefix;
    if (record.code) final += apply(" " + record.code + " ", "bgGrey", "white");
    return final + " " + title;
  }

  private formatBody(record: Record, indentation: number = 0) {
    let final = [];
    if (record.path) final.push(this.formatLocation(record.path, record.position));
    if (record.description) {
      let description = typeof record.description === "string" ? record.description.split("\n") : record.description;
      final.push(...description);
    }
    if (record.snippet) {
      let snippet = typeof record.snippet === "string" ? record.snippet.split("\n") : record.snippet;
      final.push(this.padding, ...snippet);
    }
    return final.length ? this.newLine + this.applyIndentation(final, indentation) : "";
  }
}

export { Level as LoggerLevel };
export type { Record as LoggerRecord };
