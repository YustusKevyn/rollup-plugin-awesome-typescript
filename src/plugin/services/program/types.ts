import type { IScriptSnapshot as Snapshot, ScriptKind as Kind, SourceFile as Source } from "typescript";

export interface File {
  path: string;
  input?: Input;
}

export interface Input {
  kind: Kind;
  source: Source;
  version: number;
  snapshot: Snapshot;
}
