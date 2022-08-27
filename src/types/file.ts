import type { SourceFile } from "typescript";
import type { FileKind } from "../constants";

export type File = MissingFile | ExistingFile;

interface ExistingFile extends GenericFile {
  kind: FileKind.Existing;
  source: SourceFile;
}

interface MissingFile extends GenericFile {
  kind: FileKind.Missing;
}

interface GenericFile {
  kind: FileKind;
  version: number;
}
