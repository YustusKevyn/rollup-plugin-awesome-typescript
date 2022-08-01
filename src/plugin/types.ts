import type { LoggerLevel } from "./services/logger";

export interface Options {
  cwd?: string | undefined;
  context?: string | undefined;

  lib?: string | undefined;
  config?: string | undefined;
  helpers?: string | undefined;
  compiler?: string | undefined;

  silent?: boolean | undefined;
  logLevel?: LoggerLevel | undefined;
}

export interface State {
  cycle: number;
  entries: Set<string>;
}
