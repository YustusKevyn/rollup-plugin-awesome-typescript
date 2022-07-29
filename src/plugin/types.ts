import type { LogLevel } from "./services/logger";

export interface Options {
  cwd?: string | undefined;
  context?: string | undefined;

  lib?: string | undefined;
  config?: string | undefined;
  helpers?: string | undefined;
  compiler?: string | undefined;

  silent?: boolean | undefined;
  logLevel?: LogLevel | undefined;
}
