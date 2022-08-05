import type { CompilerOptions, ProjectReference, ScriptTarget, TsConfigSourceFile } from "typescript";
import type { LoggerRecord } from "../logger";

export interface Diagnostics {
  errors: LoggerRecord[];
  warnings: LoggerRecord[];
}

export interface Fallback {
  buildInfoFile?: string;
  declarationDir?: string;
}

export interface State {
  target: ScriptTarget;
  source: TsConfigSourceFile;
  extends: string[];
  options: CompilerOptions;
  rootFiles: string[];
  references: Readonly<ProjectReference[]>;
}