import type { ScriptKind, ScriptTarget, SourceFile } from "typescript";

export interface File {
  input: {
    kind: ScriptKind;
    target: ScriptTarget;
    source: SourceFile;
    version: number;
  };
}
