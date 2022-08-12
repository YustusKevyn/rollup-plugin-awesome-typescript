import type { LoggerRecord } from "../logger";
import type {
  CompilerOptions,
  ModuleKind,
  ParseConfigHost,
  ProjectReference,
  ScriptTarget,
  TsConfigSourceFile
} from "typescript";

export interface Diagnostics {
  infos: LoggerRecord[];
  errors: LoggerRecord[];
  warnings: LoggerRecord[];
}

export interface State {
  path: string;
  base: string;
  host: ParseConfigHost;
  supportedModuleKinds: ModuleKind[];
}

export interface Store {
  source: TsConfigSourceFile;
  options: CompilerOptions;
  target: ScriptTarget;
  references: Readonly<ProjectReference[]>;
  declarations: string | false;
}
