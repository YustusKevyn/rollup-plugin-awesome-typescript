export const EmptyLine = Symbol();

export enum FileKind {
  Missing,
  Existing
}

export enum RecordCategory {
  Error,
  Warning,
  Hint,
  Info
}
