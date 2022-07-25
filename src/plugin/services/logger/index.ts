import type { Plugin } from "../..";
import type { Background, Color, Mode, Position, Properties } from "./types";

import path from "path";
import { Diagnostics } from "./diagnostics";
import { backgrounds, colors, Level, modes } from "./constants";

export class LoggerService {
  private level: Level = Level.Success;
  readonly newLine = "\n";

  readonly diagnostics: Diagnostics;

  constructor(private plugin: Plugin, level?: Level) {
    this.diagnostics = new Diagnostics(plugin, this);
    if (level !== undefined) this.level = level;
  }

  error(props: Properties | string) {
    if (this.level < Level.Error) return;
    if (typeof props === "string") props = { message: props };

    let final = this.apply(" ERROR ", "white", "bold", "red");
    if (props.code) final += " " + this.formatCode(props.code);
    final += " " + this.apply(props.message, "red", "bold");
    final += this.formatBody(props, 8) + this.newLine;
    console.log(final);
  }

  warn(props: Properties | string) {
    if (this.level < Level.Warn) return;
    if (typeof props === "string") props = { message: props };

    let final = this.apply(" WARN ", "white", "bold", "yellow");
    if (props.code) final += " " + this.formatCode(props.code);
    final += " " + this.apply(props.message, "yellow", "bold");
    final += this.formatBody(props, 7) + this.newLine;
    console.log(final);
  }

  info(props: Properties | string) {
    if (this.level < Level.Info) return;
    if (typeof props === "string") props = { message: props };

    let final = "";
    if (props.code) final += this.formatCode(props.code) + " ";
    final += props.message;
    final += this.formatBody(props);
    console.log(final);
  }

  debug(props: Properties | string) {
    if (this.level < Level.Debug) return;
    if (typeof props === "string") props = { message: props };

    let final = "";
    if (props.code) final += this.formatCode(props.code) + " ";
    final += props.message;
    final += this.formatBody(props);
    console.log(this.applyMode(final, "dim"));
  }

  apply(
    arg: any,
    color?: Color | false,
    mode?: Mode | false,
    background?: Background | false
  ) {
    let final = arg;
    if (mode) final = this.applyMode(final, mode);
    if (color) final = this.applyColor(final, color);
    if (background) final = this.applyBackground(final, background);
    return final;
  }

  applyMode(arg: any, mode: Mode) {
    let code = modes[mode],
      revert = code === 1 ? 22 : code + 20;
    return `\u001b[${code}m${arg}\u001b[${revert}m`;
  }

  applyColor(arg: any, color: Color) {
    return `\u001b[${colors[color]}m${arg}\u001b[39m`;
  }

  applyBackground(arg: any, color: Background) {
    return `\u001b[${backgrounds[color]}m${arg}\u001b[49m`;
  }

  formatId(id: string) {
    return this.apply(id, "magenta", "underline");
  }

  formatFile(file: string) {
    return this.apply(
      path.relative(this.plugin.cwd, file),
      "cyan",
      "underline"
    );
  }

  private formatCode(code: string) {
    return this.applyColor(code, "grey");
  }

  private formatLocation(file: string, position?: Position) {
    let final = "at " + this.formatFile(file);
    if (position) {
      final += ":" + this.applyColor(position.line, "yellow");
      final += ":" + this.applyColor(position.character, "yellow");
    }
    return final;
  }

  private formatBody(props: Properties, indentation: number = 0) {
    let final = "",
      next = this.newLine + " ".repeat(indentation);

    // File
    if (props.file)
      final += next + this.formatLocation(props.file, props.position);
    else if (props.id) final += next + this.formatId(props.id);

    // Snippet
    if (props.snippet) final += this.newLine + next + props.snippet.join(next);

    return final;
  }
}

export { Level as LogLevel };
