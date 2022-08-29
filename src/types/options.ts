import type { LogLevel } from "../constants";

export interface Options {
  logLevel?: LogLevel | undefined;

  /**
   * Specifies the current working directory.
   *
   * Default is `process.cwd()`
   */
  cwd?: string | undefined;

  /**
   * Specifies the base path used to parse the TSConfig. Relative paths
   * within the TSConfig are resolved with respect to this path.
   *
   * Defaults to the directory containing the TSConfig.
   */
  context?: string | undefined;

  config?: string | object | false | undefined;

  /**
   * Specifies the TypeScript helper library to use. Can be one of the
   * following:
   *
   * - A relative or absolute path pointing to a package or an entry file
   * - The name of a local dependency
   *
   * Default is `"tslib"`
   */
  helpers?: string | undefined;

  /**
   * Specifies the TypeScript compiler to use. Can be one of the following:
   *
   * - A relative or absolute path pointing to a package or an entry file
   * - The name of a local dependency
   *
   * Default is `"typescript"`
   */
  compiler?: string | undefined;

  /**
   * Specifies whether to enable type checking.
   *
   * Default is `true`
   */
  check?: boolean | undefined;

  /**
   * Overrides the TSConfig options that determine if and where to output
   * declaration files. Can be one of the following:
   *
   * - A directory name, relative or absolute path to enable the output at the
   *   specified location
   * - `true` to enable the output using `"tsBuildInfoFile"` in the TSConfig
   *   as the location
   * - `false` to explicitly disable the output of declaration files
   *
   * If undefined, the corresponding options in the TSConfig are used as is.
   */
  buildInfo?: string | boolean | undefined;

  /**
   * Overrides the TSConfig options that determine if and where to store
   * incremental compilation information. Can be one of the following:
   *
   * - A directory name, relative or absolute path to enable the output at the
   *   specified location
   * - `true` to enable the output using `"declarationDir"` of the TSConfig
   *   as the location
   * - `false` to explicitly disable the output of declaration files
   *
   * If undefined, the corresponding options in the TSConfig are used as is.
   */
  declarations?: string | boolean | undefined;
}
