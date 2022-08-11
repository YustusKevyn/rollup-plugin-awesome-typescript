import type { Plugin } from "..";
import type { LoggerRecord } from "./logger";
import type { Diagnostic, DiagnosticMessageChain, SourceFile } from "typescript";

import { apply } from "../../util/ansi";
import { concat } from "../../util/data";

export class Diagnostics {
  constructor(private plugin: Plugin) {}

  public print(diagnostics: Readonly<Diagnostic> | Readonly<Diagnostic[]>) {
    let compiler = this.plugin.compiler.instance;
    for (let diagnostic of Array.isArray(diagnostics) ? diagnostics : [diagnostics]) {
      let record = this.toRecord(diagnostic);
      if (diagnostic.category === compiler.DiagnosticCategory.Error) this.plugin.logger.error(record);
      else if (diagnostic.category === compiler.DiagnosticCategory.Warning) this.plugin.logger.warn(record);
      else this.plugin.logger.info(record);
    }
  }

  public toRecord(diagnostic: Readonly<Diagnostic>) {
    let compiler = this.plugin.compiler.instance,
      logger = this.plugin.logger,
      description: string[] = [],
      record: LoggerRecord = {
        code: "TS" + diagnostic.code,
        message: this.toMessage(diagnostic.messageText)
      };

    // File
    if (diagnostic.file) {
      record.path = diagnostic.file.fileName;
      record.position = compiler.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start!);
      concat(description, logger.PADDING, this.toSnippet(diagnostic.file, diagnostic.start!, diagnostic.length!));
    }

    // Information
    if (diagnostic.relatedInformation?.length) {
      let indentation = "   ";
      for (let info of diagnostic.relatedInformation) {
        concat(
          description,
          logger.PADDING,
          this.toMessage(info.messageText).map((line, i) => (i === 0 ? "─→ " : indentation) + apply(line, "bold"))
        );
        if (info.file) {
          let position = compiler.getLineAndCharacterOfPosition(info.file, info.start!);
          concat(
            description,
            indentation + logger.formatLocation(info.file.fileName, position),
            logger.PADDING,
            this.toSnippet(info.file, info.start!, info.length!, 1, 1, 5).map(line => indentation + line)
          );
        }
      }
    }

    record.description = description;
    return record;
  }

  private toMessage(message: DiagnosticMessageChain | string) {
    if (typeof message === "string") return [message];
    let final: string[] = [],
      traverse = (chain: DiagnosticMessageChain, level = 0) => {
        final.push("  ".repeat(level) + chain.messageText);
        if (chain.next) for (let child of chain.next) traverse(child, level + 1);
      };
    traverse(message);
    return final;
  }

  private toSnippet(source: SourceFile, index: number, length: number, padding = 2, placeholder = 2, maxLines = 8) {
    let compiler = this.plugin.compiler.instance,
      lastLine = compiler.getLineAndCharacterOfPosition(source, source.text.length).line,
      start = compiler.getLineAndCharacterOfPosition(source, index),
      startLine = Math.max(0, start.line - padding),
      end = compiler.getLineAndCharacterOfPosition(source, index + length),
      endLine = Math.min(lastLine, end.line + padding),
      lines = end.line - start.line + 1,
      gutterWidth = (endLine + 1).toString().length,
      snippet: string[] = [];

    if (startLine - padding < 0) snippet.push(apply(" ".repeat(gutterWidth) + " ┬", "grey"));
    for (let i = startLine; i <= endLine; i++) {
      if (lines > maxLines && i === start.line + placeholder + 1) {
        let hidden = apply(" ".repeat(gutterWidth) + " ╎", "grey");
        for (let j = 0; j < placeholder; j++) snippet.push(hidden);
        i = end.line - placeholder;
      }

      let lineStart = compiler.getPositionOfLineAndCharacter(source, i, 0),
        lineEnd = i === lastLine ? source.text.length : compiler.getPositionOfLineAndCharacter(source, i + 1, 0),
        lineContent = source.text.slice(lineStart, lineEnd).trimEnd(),
        final = apply((i + 1).toString().padStart(gutterWidth) + " │ ", "grey") + " ";

      if (i < start.line || i > end.line) final += apply(lineContent, "dim");
      else {
        let lineErrorStart = i === start.line ? start.character : 0,
          lineErrorEnd = i === end.line ? end.character : lineContent.length;

        final += apply(lineContent.slice(0, lineErrorStart), "dim");
        final += apply(lineContent.slice(lineErrorStart, lineErrorEnd), "brightWhite", "bold", "italic");
        final += apply(lineContent.slice(lineErrorEnd), "dim");
      }

      snippet.push(final);
    }
    if (endLine + padding > lastLine) snippet.push(apply(" ".repeat(gutterWidth) + " ┴", "grey"));

    return snippet;
  }
}
