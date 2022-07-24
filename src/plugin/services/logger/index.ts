import type { Plugin } from "../..";
import type { Diagnostic } from "typescript";
import type { Color, Mode, Position, Properties } from "./types";

import path from "path";
import { colors, Level, modes } from "./constants";
import {
  DiagnosticCategory,
  flattenDiagnosticMessageText,
  getLineAndCharacterOfPosition
} from "typescript";

export class LoggerService {
  private plugin: Plugin;
  private level: Level = Level.Success;

  constructor(plugin: Plugin, level?: Level) {
    this.plugin = plugin;
    if (level !== undefined) this.level = level;
  }

  error(arg: Properties | string) {
    if (this.level < Level.Error) return;
    if (typeof arg === "string") arg = { message: arg };

    let header = this.applyModeAndColor("bold", "red", " \u2A2F ");
    if (arg.code) header += this.formatCode(arg.code) + " ";
    header += this.applyModeAndColor("bold", "red", arg.message);
    console.log(header + this.formatBody(arg));
  }

  warn(arg: Properties | string) {
    if (this.level < Level.Warn) return;
    if (typeof arg === "string") arg = { message: arg };

    let header = this.applyModeAndColor("bold", "yellow", " \u26A0 ");
    if (arg.code) header += this.formatCode(arg.code) + " ";
    header += this.applyModeAndColor("bold", "yellow", arg.message);
    console.log(header + this.formatBody(arg));
  }

  success(arg: Properties | string) {
    if (this.level < Level.Success) return;
    if (typeof arg === "string") arg = { message: arg };

    let header = this.applyModeAndColor("bold", "green", " \u2713 ");
    if (arg.code) header += this.formatCode(arg.code) + " ";
    header += this.applyColor("green", arg.message);
    console.log(header + this.formatBody(arg));
  }

  info(arg: Properties | string) {
    if (this.level < Level.Info) return;
    if (typeof arg === "string") arg = { message: arg };

    let header = " \u2022 ";
    if (arg.code) header += this.formatCode(arg.code) + " ";
    console.log(header + arg.message + this.formatBody(arg));
  }

  debug(arg: Properties | string) {
    if (this.level < Level.Debug) return;
    if (typeof arg === "string") arg = { message: arg };

    let header = " \u2022 ";
    if (arg.code) header += this.formatCode(arg.code) + " ";
    console.log(
      this.applyMode("dim", header + arg.message + this.formatBody(arg))
    );
  }

  diagnostic(arg: Diagnostic | Diagnostic[]) {
    if (!Array.isArray(arg)) arg = [arg];
    for (let diagnostic of arg) {
      let props: Properties = {
        message: flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
        code: "TS" + diagnostic.code
      };
      if (diagnostic.file) {
        props.file = diagnostic.file.fileName;
        props.position = getLineAndCharacterOfPosition(
          diagnostic.file,
          diagnostic.start!
        );
      }

      if (diagnostic.category === DiagnosticCategory.Error) this.error(props);
      else if (diagnostic.category === DiagnosticCategory.Warning)
        this.warn(props);
      else this.info(props);
    }
  }

  applyMode(mode: Mode, arg: any) {
    let code = modes[mode],
      revert = code === 1 ? 22 : code + 20;
    return `\u001b[${code}m${arg}\u001b[${revert}m`;
  }

  applyColor(color: Color, arg: any) {
    return `\u001b[${colors[color]}m${arg}\u001b[39m`;
  }

  applyModeAndColor(mode: Mode, color: Color, arg: any) {
    return this.applyMode(mode, this.applyColor(color, arg));
  }

  formatFile(file: string) {}

  private formatCode(code: string) {
    return this.applyColor("green", code);
  }

  private formatLocation(file: string, position?: Position) {
    let final = "at " + this.formatFile(file);
    if (position) {
      final += ":" + this.applyColor("yellow", position.line);
      final += ":" + this.applyColor("yellow", position.character);
    }
    return final;
  }

  private formatBody(props: Properties) {
    let final = "";
    if (props.file)
      final += "\n   " + this.formatLocation(props.file, props.position);
    return final;
  }
}

export { Level as LogLevel };
