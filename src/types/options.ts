import type { LogLevel } from "../constants";
import type { CompilerOptions } from "typescript";

export interface Options {
  /**
   * Specifies the log level to which the log output should be restricted. Can
   * be one of the following:
   *
   * - `LogLevel.Error` or `0`
   * - `LogLevel.Warn` or `1`
   * - `LogLevel.Info` or `2`
   *
   * Default is `LogLevel.Info`
   */
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

  /**
   * Specifies which TSConfig should be used. Can be one of the following:
   *
   * - A relative or absolute path
   * - A filename to search for in the directory tree, starting from the
   *   current working directory
   * - `false` to disable the usage of a TSConfig
   *
   * Default is `"tsconfig.json"`
   */
  config?: string | false | undefined;

  /**
   * Overrides the TSConfig compiler options.
   */
  compilerOptions?: CompilerOptions | undefined;

  /**
   * Overrides the injected helper library. Must be a relative or absolute path
   * pointing to an ES Module.
   */
  helpers?: string | undefined;

  /**
   * Overrides the compiler used for transpilation with the specified instance.
   */
  compiler?: any;

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
