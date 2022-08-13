import type { SourceFile } from "typescript";
import type { EmptyLine, FileKind, RecordCategory } from "./constants";

export type Line = string | typeof EmptyLine;
export type Message = Line | Line[];

export interface Position {
  line: number;
  character: number;
}

export interface Record extends GenericRecord {
  category: RecordCategory;
}

export interface GenericRecord extends RecordChild {
  code?: string;
  children?: RecordChild[];
}

export interface RecordChild {
  message: Message;
  description?: Message;
  snippet?: Message;
  path?: string;
  position?: Position;
}

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

export interface Build {
  dependencies: Set<string>;
  output: Output;
}

export interface Output {
  js: JsOutput | false;
  declaration: DeclarationOutput | false | null;
}

export interface JsOutput {
  text: string;
  map: string | undefined;
}

export interface DeclarationOutput {
  text: string;
  map: string | undefined;
}
