import type { CompilerOptions, ProjectReference, ScriptTarget, TsConfigSourceFile } from "typescript";
import type { LoggerRecord } from "../logger";

export interface Diagnostics {
  infos: LoggerRecord[];
  errors: LoggerRecord[];
  warnings: LoggerRecord[];
}

export interface State {
  target: ScriptTarget;
  source: TsConfigSourceFile;
  extends: string[];
  options: CompilerOptions;
  rootFiles: string[];
  references: Readonly<ProjectReference[]>;
}
