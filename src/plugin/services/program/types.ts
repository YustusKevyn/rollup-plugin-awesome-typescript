import type { IScriptSnapshot as Snapshot } from "typescript";

export interface File {
  script?: Script;
  output?: Output;
}

export interface Script {
  version: number;
  snapshot: Snapshot;
}

// DO NOT SAVE DIAGNOSTICS!!!

export interface Output {
  version: number;
  code?: string;
  codeMap?: string;
  declaration?: string;
  declarationMap?: string;
}
