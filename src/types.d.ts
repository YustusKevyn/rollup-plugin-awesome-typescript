export function awesomeTypescript(options?: Options): any;

export interface Options {
  /**
   * Specifies the current working directory.
   *
   * Default is `process.cwd()`
   */
  cwd?: string | undefined;

  /**
   * Specifies the base path used to parse the TSConfig. Relative paths
   * within the configuration are resolved with respect to this path.
   *
   * Defaults to the directory containing the TSConfig.
   */
  context?: string | undefined;

  /**
   * Specifies the location of the TSConfig. Can be one of the following:
   *
   * - A relative or absolute path
   * - A filename to search for in the directory tree, starting from the
   *   current working directory
   *
   * Default is `"tsconfig.json"`
   */
  config?: string | undefined;

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
   * Specifies if and where to store incremental compilation information. Can
   * be one of the following:
   *
   * - A directory name, relative or absolute path to enable the output at the
   *   specified location (ignoring all options in the TSConfig)
   * - `true` to enable the output using `"tsBuildInfoFile"` in the TSConfig
   *   as the location
   * - `false` to explicitly disable the output of declaration files
   *
   * If undefined, the options in the TSConfig and are used as is.
   */
  buildInfo?: string | boolean | undefined;

  /**
   * Specifies if and where to output declaration files. Can be one of the
   * following:
   *
   * - A directory name, relative or absolute path to enable the output at the
   *   specified location (ignoring all options in the TSConfig)
   * - `true` to enable the output using `"declarationDir"` of the TSConfig
   *   as the location
   * - `false` to explicitly disable the output of declaration files
   *
   * If undefined, the options in the TSConfig and are used as is.
   */
  declarations?: string | boolean | undefined;
}
