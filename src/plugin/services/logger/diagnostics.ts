import type { Logger } from ".";
import type { Plugin } from "../..";
import type { Record } from "./types";
import type { Diagnostic, SourceFile } from "typescript";

import { apply } from "../../../util/ansi";

export class Diagnostics {
  constructor(private logger: Logger, private plugin: Plugin) {}

  public print(diagnostics: Readonly<Diagnostic> | Readonly<Diagnostic[]>) {
    let compiler = this.plugin.compiler.instance;
    for (let diagnostic of Array.isArray(diagnostics) ? diagnostics : [diagnostics]) {
      let props = this.getRecord(diagnostic);
      if (diagnostic.category === compiler.DiagnosticCategory.Error) this.logger.error(props);
      else if (diagnostic.category === compiler.DiagnosticCategory.Warning) this.logger.warn(props);
      else this.logger.info(props);
    }
  }

  public getRecord(diagnostic: Diagnostic) {
    let compiler = this.plugin.compiler.instance,
      props: Record = {
        message: compiler.flattenDiagnosticMessageText(diagnostic.messageText, this.logger.newLine),
        code: "TS" + diagnostic.code
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
      placeholderLines = 2,
      maxHighlightLines = 8;

    let compiler = this.plugin.compiler.instance,
      highlightStart = compiler.getLineAndCharacterOfPosition(source, index),
      highlightEnd = compiler.getLineAndCharacterOfPosition(source, index + length),
      highlightLines = highlightEnd.line - highlightStart.line + 1,
      lastLine = compiler.getLineAndCharacterOfPosition(source, source.text.length).line,
      startLine = Math.max(0, highlightStart.line - contextLines),
      endLine = Math.min(lastLine, highlightEnd.line + contextLines),
      gutterWidth = (endLine + 1).toString().length,
      snippet: string[] = [];

    if (startLine - contextLines < 0) snippet.push(apply(" ".repeat(gutterWidth) + " ┬", "grey"));
    for (let i = startLine; i <= endLine; i++) {
      if (highlightLines > maxHighlightLines && i === highlightStart.line + placeholderLines + 1) {
        let hidden = apply(" ".repeat(gutterWidth) + " ╎", "grey");
        for (let j = 0; j < placeholderLines; j++) snippet.push(hidden);
        i = highlightEnd.line - placeholderLines;
      }

      let lineStart = compiler.getPositionOfLineAndCharacter(source, i, 0),
        lineEnd = i === lastLine ? source.text.length : compiler.getPositionOfLineAndCharacter(source, i + 1, 0),
        lineContent = source.text.slice(lineStart, lineEnd).trimEnd(),
        final = apply((i + 1).toString().padStart(gutterWidth) + " │ ", "grey") + " ";

      if (i < highlightStart.line || i > highlightEnd.line) final += apply(lineContent, "dim");
      else {
        let lineErrorStart = i === highlightStart.line ? highlightStart.character : 0,
          lineErrorEnd = i === highlightEnd.line ? highlightEnd.character : lineContent.length;

        final += apply(lineContent.slice(0, lineErrorStart), "dim");
        final += apply(lineContent.slice(lineErrorStart, lineErrorEnd), "brightWhite", "bold", "italic");
        final += apply(lineContent.slice(lineErrorEnd), "dim");
      }

      snippet.push(final);
    }
    if (endLine + contextLines > lastLine) snippet.push(apply(" ".repeat(gutterWidth) + " ┴", "grey"));

    return snippet;
  }
}
