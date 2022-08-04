export function awesomeTypescript(options?: Options): any;

export interface Options {
  cwd?: string | undefined;
  context?: string | undefined;

  lib?: string | undefined;
  config?: string | undefined;
  helpers?: string | undefined;
  compiler?: string | undefined;

  declarations?: string | undefined;
}
