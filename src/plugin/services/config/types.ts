import type { LoggerRecord } from "../logger";
import type { CompilerOptions, ProjectReference, ScriptTarget, TsConfigSourceFile } from "typescript";

export interface Diagnostics {
  infos: LoggerRecord[];
  errors: LoggerRecord[];
  warnings: LoggerRecord[];
}

export interface State {
  source: TsConfigSourceFile;
  options: CompilerOptions;
  target: ScriptTarget;
  references: Readonly<ProjectReference[]>;
  rootFiles: string[];
  configFiles: string[];
}
