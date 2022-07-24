import { LogLevel } from "./services/logger";

export interface Options {
  cwd?: string | undefined;
  context?: string | undefined;

  include?: string | string[];
  exclude?: string | string[];

  config?: string | undefined;
  helpers?: string | undefined;
  compiler?: string | undefined;

  silent?: boolean | undefined;
  logLevel?: LogLevel | undefined;
}
