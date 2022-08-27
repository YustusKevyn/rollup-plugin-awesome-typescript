import type { Plugin } from "../plugin";
import type { Message, Position, Record } from "../types";
import { Background, Color, Mode, Styles } from "../util/ansi";

import { relative } from "path";
import { apply } from "../util/ansi";
import { concat } from "../util/data";
import { normalise } from "../util/path";
import { EmptyLine, LogLevel, RecordCategory } from "../constants";

export class Logger {
  constructor(private plugin: Plugin, private level: LogLevel = LogLevel.Info) {}

  public log(message: Message, level: LogLevel = LogLevel.Info) {
    if (level > this.level) return;
    let final = "";
    if (!Array.isArray(message)) message = [message];
    for (let i = 0; i < message.length; i++) {
      let line = message[i];
      if (typeof line === "string") final += line;
      if (i !== message.length - 1) final += "\n";
    }
    console.log(final);
  }

  public formatRecord(record: Record) {
    let label, color: Color | undefined, background: Background | undefined;
    if (record.category === RecordCategory.Error) {
      label = "ERROR";
      color = Color.Red;
      background = Background.Red;
    } else if (record.category === RecordCategory.Warning) {
      label = "WARNING";
      color = Color.Yellow;
      background = Background.Yellow;
    } else if (record.category === RecordCategory.Hint) {
      label = "HINT";
      color = Color.Cyan;
      background = Background.Cyan;
    }

    let indentation = label ? " ".repeat(label.length + 3) : "",
      message: Message = Array.isArray(record.message) ? record.message : [record.message],
      final: Message = [];

    // Message
    let first = "";
    if (label) first += apply(" " + label + " ", Color.BrightWhite, Mode.Bold, background) + " ";
    if (record.code) first += apply(" " + record.code + " ", Color.White, Background.Grey) + " ";
    if (typeof message[0] === "string") first += apply(message[0], color, Mode.Bold);
    concat(final, first, this.formatMessage(message.slice(1), indentation, color, Mode.Bold));

    // Body
    if (record.path) final.push(indentation + this.formatLocation(record.path, record.position));
    if (record.description) concat(final, this.formatMessage(record.description, indentation));
    if (record.snippet) concat(final, EmptyLine, this.formatMessage(record.snippet, indentation));

    // Children
    if (record.children) {
      let childIndentation = indentation + "   ";
      for (let child of record.children) {
        let message: Message = Array.isArray(child.message) ? child.message : [child.message];
        concat(
          final,
          EmptyLine,
          indentation + "─→ " + apply(message[0], Mode.Bold),
          this.formatMessage(message.slice(1), childIndentation)
        );

        // Body
        if (child.path) final.push(childIndentation + this.formatLocation(child.path, child.position));
        if (child.description) concat(final, this.formatMessage(child.description, childIndentation));
        if (child.snippet) concat(final, EmptyLine, this.formatMessage(child.snippet, childIndentation));
      }
    }

    // Finalise
    final.push(EmptyLine);
    return final;
  }

  public formatPath(path: string) {
    return apply(relative(this.plugin.cwd, normalise(path)), Color.Cyan, Mode.Underline);
  }

  public formatLocation(path: string, position?: Position) {
    let final = "at " + this.formatPath(path);
    if (position) {
      final += ":" + apply(position.line + 1, Color.Yellow);
      final += ":" + apply(position.character + 1, Color.Yellow);
    }
    return final;
  }

  public formatMessage(message?: Message, indentation?: string | false, ...styles: Styles) {
    if (!message) return [];
    if (!Array.isArray(message)) message = [message];

    let final = [];
    for (let line of message) {
      if (line === EmptyLine) {
        final.push("");
        continue;
      }

      if (indentation) line = indentation + line;
      if (styles.length) line = apply(line, ...styles);
      final.push(line);
    }
    return final;
  }
}
