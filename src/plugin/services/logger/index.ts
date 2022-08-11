import type { Plugin } from "../..";
import type { Position, Record } from "./types";
import type { Color } from "../../../util/ansi";

import { relative } from "path";
import { apply } from "../../../util/ansi";
import { concat } from "../../../util/data";
import { normalize } from "../../../util/path";
import { applyBackgroundColor } from "../../../util/ansi";

enum Level {
  Error,
  Warning,
  Info,
  Verbose
}

export class Logger {
  readonly PADDING = "";

  private level = Level.Info;

  constructor(private plugin: Plugin) {}

  public log(message: string | string[], level: Level = Level.Info) {
    if (level > this.level) return;
    console.log(typeof message === "string" ? message : message.join("\n"));
  }

  public info(record: Record) {
    this.log(this.format("INFO", "cyan", record), Level.Error);
  }

  public warn(record: Record) {
    this.log(this.format("WARN", "yellow", record), Level.Error);
  }

  public error(record: Record) {
    this.log(this.format("ERROR", "red", record), Level.Error);
  }

  public format(label: string, color: Color, record: Record) {
    let indentation = " ".repeat(label.length + 3),
      description = typeof record.description === "string" ? [record.description] : record.description,
      message = typeof record.message === "string" ? [record.message] : record.message,
      final = [];

    // Message
    let first = applyBackgroundColor(apply(" " + label + " ", "brightWhite", "bold"), color) + " ";
    if (record.code) first += apply(" " + record.code + " ", "bgGrey", "white") + " ";
    final.push(first + apply(message[0], color, "bold"));
    for (let i = 1; i < message.length; i++) final.push(indentation + apply(message[i], color, "bold"));

    // Location
    if (record.path) final.push(indentation + this.formatLocation(record.path, record.position));

    // Description
    if (description?.length) {
      concat(
        final,
        description.map(line => indentation + line)
      );
    }

    // Finalize
    final.push(this.PADDING);
    return final;
  }

  public formatPath(path: string) {
    return apply(relative(this.plugin.cwd, normalize(path)), "cyan", "underline");
  }

  public formatLocation(path: string, position?: Position) {
    let final = "at " + this.formatPath(path);
    if (position) {
      final += ":" + apply(position.line + 1, "yellow");
      final += ":" + apply(position.character + 1, "yellow");
    }
    return final;
  }
}

export type { Record as LoggerRecord };
