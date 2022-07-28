import type { Logger } from ".";
import type { Plugin } from "../..";
import type { Properties } from "./types";
import type { Diagnostic, SourceFile } from "typescript";

import { apply } from "../../util/ansi";
import { lpad } from "../../util/string";

export class Diagnostics {
  constructor(private logger: Logger, private plugin: Plugin) {}

  print(diagnostics: Diagnostic | Diagnostic[]) {
    let compiler = this.plugin.compiler.instance;
    if (!Array.isArray(diagnostics)) diagnostics = [diagnostics];
    for (let diagnostic of diagnostics) {
      let props = this.getProps(diagnostic);
      if (diagnostic.category === compiler.DiagnosticCategory.Error) this.logger.error(props);
      else if (diagnostic.category === compiler.DiagnosticCategory.Warning) this.logger.warn(props);
      else this.logger.info(props);
    }
  }

  private getProps(diagnostic: Diagnostic) {
    let compiler = this.plugin.compiler.instance,
      props: Properties = {
        message: compiler.flattenDiagnosticMessageText(diagnostic.messageText, this.logger.newLine),
        prefix: "TS" + diagnostic.code
      };

    // File
    if (diagnostic.file) {
      props.path = diagnostic.file.fileName;
      props.position = compiler.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start!);
      props.snippet = this.getSnippet(diagnostic.file, diagnostic.start!, diagnostic.length!);
    }

    return props;
  }

  private getSnippet(source: SourceFile, index: number, length: number) {
    const contextLines = 2,
      minHiddenLines = 2,
      maxErrorLines = 8;

    let compiler = this.plugin.compiler.instance,
      errorStart = compiler.getLineAndCharacterOfPosition(source, index),
      errorEnd = compiler.getLineAndCharacterOfPosition(source, index + length),
      errorLines = errorStart.line - errorEnd.line,
      lastLine = compiler.getLineAndCharacterOfPosition(source, source.text.length).line,
      startLine = Math.max(0, errorStart.line - contextLines),
      endLine = Math.min(lastLine, errorEnd.line + contextLines),
      gutterWidth = (endLine + 1).toString().length,
      snippet: string[] = [];

    if (startLine - contextLines < 0) snippet.push(apply(" ".repeat(gutterWidth) + " ┬", "grey"));
    for (let i = startLine; i <= endLine; i++) {
      if (errorLines >= maxErrorLines && i === errorStart.line + minHiddenLines + 1) {
        let hidden = apply(" ".repeat(gutterWidth) + " ╎", "grey");
        snippet = snippet.concat(new Array(minHiddenLines).fill(hidden));
        i = errorEnd.line - minHiddenLines;
      }

      let lineStart = compiler.getPositionOfLineAndCharacter(source, i, 0),
        lineEnd = i === lastLine ? source.text.length : compiler.getPositionOfLineAndCharacter(source, i + 1, 0),
        lineContent = source.text.slice(lineStart, lineEnd).trimEnd(),
        final = apply(lpad((i + 1).toString(), gutterWidth) + " │ ", "grey") + " ";

      if (i < errorStart.line || i > errorEnd.line) final += apply(lineContent, "dim");
      else {
        let lineErrorStart = i === errorStart.line ? errorStart.character : 0,
          lineErrorEnd = i === errorEnd.line ? errorEnd.character : lineContent.length;

        final += apply(lineContent.slice(0, lineErrorStart), "dim");
        final += apply(lineContent.slice(lineErrorStart, lineErrorEnd), "brightWhite", "bold", "italic");
        final += apply(lineContent.slice(lineErrorEnd), "dim");
      }
    }
    if (endLine + contextLines > lastLine) snippet.push(apply(" ".repeat(gutterWidth) + " ┴", "grey"));

    return snippet;
  }
}
