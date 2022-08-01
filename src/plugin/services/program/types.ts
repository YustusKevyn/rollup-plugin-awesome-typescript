import type { FileKind } from ".";
import type { SourceFile as Source } from "typescript";

export type File = MissingFile | ExistingFile;

export interface MissingFile {
  kind: FileKind.Missing;
  version: number;
}

export interface ExistingFile {
  kind: FileKind.Existing;
  version: number;
  source: Source;
  build?: Build;
}

export interface Build {
  output: Output;
}

export interface Output {
  code?: string;
  codeMap?: string;
  declaration?: string;
  declarationMap?: string;
}
