export * from "./language";

export const EmptyLine = Symbol();

export enum PluginMode {
  Build,
  Watch,
  Config
}

export enum LogLevel {
  Error = 0,
  Warn = 1,
  Info = 2
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
