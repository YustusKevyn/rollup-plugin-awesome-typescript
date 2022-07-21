import type typescript from "typescript";
import type { CompilerOptions, TsConfigSourceFile } from "typescript";
import type { LogLevel } from "./util/logger";

export type Compiler = typeof typescript;

export interface Options {
  cwd?: string | undefined;
  context?: string | undefined;

  config?: string | undefined;
  helpers?: string | undefined;
  compiler?: Compiler | string | undefined;

  silent?: boolean | undefined;
  logLevel?: LogLevel | undefined;
}