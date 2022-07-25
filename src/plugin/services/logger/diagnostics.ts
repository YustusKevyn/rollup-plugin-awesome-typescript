import type { Plugin } from "../..";
import type { Properties } from "./types";
import type { LoggerService } from ".";
import { Diagnostic, EndOfLineState, SourceFile } from "typescript";

import {
  DiagnosticCategory,
  flattenDiagnosticMessageText,
  getLineAndCharacterOfPosition,
  getPositionOfLineAndCharacter
} from "typescript";
import { lpad } from "../../util/string";

export class Diagnostics {
  constructor(private plugin: Plugin, private logger: LoggerService) {}

  print(diagnostics: Diagnostic | Diagnostic[]) {
    if (!Array.isArray(diagnostics)) diagnostics = [diagnostics];
    for (let diagnostic of diagnostics) {
      let props = this.getProps(diagnostic);
      if (diagnostic.category === DiagnosticCategory.Error)
        this.logger.error(props);
      else if (diagnostic.category === DiagnosticCategory.Warning)
        this.logger.warn(props);
      else this.logger.info(props);
    }
  }

  private getProps(diagnostic: Diagnostic) {
    let props: Properties = {
      message: flattenDiagnosticMessageText(
        diagnostic.messageText,
        this.logger.newLine
      ),
      code: "TS" + diagnostic.code
    };

    // File
    if (diagnostic.file) {
      props.file = diagnostic.file.fileName;
      props.position = getLineAndCharacterOfPosition(
        diagnostic.file,
        diagnostic.start!
      );
      props.snippet = this.getSnippet(
        diagnostic.file,
        diagnostic.start!,
        diagnostic.length!
      );
    }

    return props;
  }

  private getSnippet(source: SourceFile, index: number, length: number) {
    const additionalLines = 2,
      minHiddenLines = 2,
      maxLines = 8;

    let start = getLineAndCharacterOfPosition(source, index),
      end = getLineAndCharacterOfPosition(source, index + length),
      last = getLineAndCharacterOfPosition(source, source.text.length),
      gutterWidth = (end.line + 1).toString().length;

    let snippet: string[] = [];
    if (start.line - additionalLines < 0)
      snippet.push(
        this.logger.applyColor(" ".repeat(gutterWidth) + " ┬", "grey")
      );
    for (
      let i = Math.max(start.line - additionalLines, 0);
      i <= Math.min(end.line + additionalLines, last.line);
      i++
    ) {
      if (
        end.line - start.line >= maxLines &&
        i === start.line + minHiddenLines + 1
      ) {
        let hidden = this.logger.applyColor(
          " ".repeat(gutterWidth) + " ╎",
          "grey"
        );
        snippet = snippet.concat(new Array(minHiddenLines).fill(hidden));
        i = end.line - minHiddenLines;
      }

      let lineStart = getPositionOfLineAndCharacter(source, i, 0),
        lineEnd =
          i === last.line
            ? source.text.length
            : getPositionOfLineAndCharacter(source, i + 1, 0),
        lineContent = source.text.slice(lineStart, lineEnd).trimEnd();

      let final =
        this.logger.applyColor(
          lpad((i + 1).toString(), gutterWidth) + " │ ",
          "grey"
        ) + " ";

      if (i < start.line || i > end.line)
        final += this.logger.applyMode(lineContent, "dim");
      else {
        let errorStart = i === start.line ? start.character : 0,
          errorEnd = i === end.line ? end.character : lineContent.length,
          error = lineContent.slice(errorStart, errorEnd);

        final += this.logger.applyMode(lineContent.slice(0, errorStart), "dim");
        final += this.logger.applyMode(
          this.logger.apply(error, "white", "italic"),
          "bold"
        );
        final += this.logger.applyMode(lineContent.slice(errorEnd), "dim");
      }

      snippet.push(final);
    }
    if (end.line + additionalLines > last.line)
      snippet.push(
        this.logger.applyColor(" ".repeat(gutterWidth) + " ┴", "grey")
      );
    return snippet;
  }
}
