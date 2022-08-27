import type { Plugin } from "../plugin";
import type { Record, RecordChild } from "../types";
import type { Diagnostic, DiagnosticCategory, DiagnosticMessageChain, SourceFile } from "typescript";

import { apply, Color, Mode } from "../util/ansi";
import { RecordCategory } from "../constants";

export class Diagnostics {
  constructor(private plugin: Plugin) {}

  public record(diagnostics: Readonly<Diagnostic> | Readonly<Diagnostic[]>) {
    for (let diagnostic of Array.isArray(diagnostics) ? diagnostics : [diagnostics]) {
      this.plugin.tracker.record(this.toRecord(diagnostic));
    }
  }

  public toRecord(diagnostic: Diagnostic) {
    let compiler = this.plugin.compiler.instance,
      record: Record = {
        code: "TS" + diagnostic.code,
        category: this.toCategory(diagnostic.category),
        message: this.toMessage(diagnostic.messageText),
        children: []
      };

    if (diagnostic.file) {
      record.path = diagnostic.file.fileName;
      record.position = compiler.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start!);
      record.snippet = this.toSnippet(diagnostic.file, diagnostic.start!, diagnostic.length!);
    }

    // Information
    if (diagnostic.relatedInformation?.length) {
      for (let info of diagnostic.relatedInformation) {
        let child: RecordChild = { message: this.toMessage(info.messageText) };
        if (info.file) {
          child.path = info.file.fileName;
          child.position = compiler.getLineAndCharacterOfPosition(info.file, info.start!);
          child.snippet = this.toSnippet(info.file, info.start!, info.length!, 1, 1, 5);
        }
        record.children!.push(child);
      }
    }
    return record;
  }

  private toCategory(category: DiagnosticCategory): RecordCategory {
    let { DiagnosticCategory } = this.plugin.compiler.instance;
    if (category === DiagnosticCategory.Error) return RecordCategory.Error;
    if (category === DiagnosticCategory.Warning) return RecordCategory.Warning;
    if (category === DiagnosticCategory.Suggestion) return RecordCategory.Hint;
    return RecordCategory.Info;
  }

  private toMessage(message: DiagnosticMessageChain | string) {
    if (typeof message === "string") return [message];
    let final: string[] = [],
      traverse = (chain: DiagnosticMessageChain, level = 0) => {
        final.push(chain.messageText);
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

    if (startLine - padding < 0) snippet.push(apply(" ".repeat(gutterWidth) + " ┬", Color.Grey));
    for (let i = startLine; i <= endLine; i++) {
      if (lines > maxLines && i === start.line + placeholder + 1) {
        let hidden = apply(" ".repeat(gutterWidth) + " ╎", Color.Grey);
        for (let j = 0; j < placeholder; j++) snippet.push(hidden);
        i = end.line - placeholder;
      }

      let lineStart = compiler.getPositionOfLineAndCharacter(source, i, 0),
        lineEnd = i === lastLine ? source.text.length : compiler.getPositionOfLineAndCharacter(source, i + 1, 0),
        lineContent = source.text.slice(lineStart, lineEnd).trimEnd(),
        final = apply((i + 1).toString().padStart(gutterWidth) + " │ ", Color.Grey) + " ";

      if (i < start.line || i > end.line) final += apply(lineContent, Mode.Dim);
      else {
        let lineErrorStart = i === start.line ? start.character : 0,
          lineErrorEnd = i === end.line ? end.character : lineContent.length;

        final += apply(lineContent.slice(0, lineErrorStart), Mode.Dim);
        final += apply(lineContent.slice(lineErrorStart, lineErrorEnd), Color.BrightWhite, Mode.Bold, Mode.Italic);
        final += apply(lineContent.slice(lineErrorEnd), Mode.Dim);
      }

      snippet.push(final);
    }
    if (endLine + padding > lastLine) snippet.push(apply(" ".repeat(gutterWidth) + " ┴", Color.Grey));

    return snippet;
  }
}
