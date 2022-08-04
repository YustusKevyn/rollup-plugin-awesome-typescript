import type { FileKind } from ".";
import type { SourceFile } from "typescript";

export type File = MissingFile | ExistingFile;

interface GenericFile {
  kind: FileKind;
  version: number;
}

export interface MissingFile extends GenericFile {
  kind: FileKind.Missing;
}

export interface ExistingFile extends GenericFile {
  kind: FileKind.Existing;
  source: SourceFile;
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
