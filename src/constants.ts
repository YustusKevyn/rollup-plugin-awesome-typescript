export const EmptyLine = Symbol();

export enum PluginMode {
  Build,
  Watch,
  Config
}

export enum LogLevel {
  Error,
  Warning,
  Info,
  Debug
}

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
