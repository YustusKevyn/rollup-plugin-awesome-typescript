import type { Plugin } from "..";
import type { CompilerOptions, ParsedCommandLine } from "typescript";

import { exit } from "../util/process";
import { isRelative } from "../util/path";
import { dirname, isAbsolute, join, resolve } from "path";

export class Config {
  readonly location: string;
  readonly options: CompilerOptions;

  constructor(private plugin: Plugin, input: string) {
    this.location = this.find(input);

    let source = this.read(this.location),
      config = this.parse(this.location, source);
    this.options = this.normalize(config).options;
  }

  private find(input: string) {
    let compiler = this.plugin.compiler.instance,
      logger = this.plugin.logger,
      location: string;

    // Absolute path
    if (isAbsolute(input)) {
      location = input;
      if (!compiler.sys.fileExists(location)) {
        logger.error({ message: "Configuration file does not exist.", location });
        exit();
      }
    }

    // Relative path
    if (isRelative(input)) {
      location = resolve(this.plugin.cwd, input);
      if (!compiler.sys.fileExists(location)) {
        logger.error({ message: "Configuration file does not exists.", location });
        exit();
      }
    }

    // Filename
    else {
      let dir = this.plugin.cwd;
      while (true) {
        let joined = join(dir, input);
        if (compiler.sys.fileExists(joined)) {
          location = joined;
          break;
        }

        let parent = dirname(dir);
        if (parent === dir) {
          logger.error(`Configuration file with name "${input}" does not exist in directory tree.`);
          exit();
        }
        dir = parent;
      }
    }

    logger.info(`Using configuration at ${logger.formatPath(location)}.`);
    return location;
  }

  private read(location: string) {
    let logger = this.plugin.logger,
      compiler = this.plugin.compiler.instance,
      data = compiler.readConfigFile(location, compiler.sys.readFile);

    if (data.error) {
      logger.diagnostics.print(data.error);
      exit();
    }
    return data.config;
  }

  private parse(location: string, source: string) {
    let logger = this.plugin.logger,
      compiler = this.plugin.compiler.instance,
      result = compiler.parseJsonConfigFileContent(source, compiler.sys, this.plugin.context ?? dirname(location));

    if (result.errors.length) {
      logger.diagnostics.print(result.errors);
      exit();
    }
    return result;
  }

  private normalize(config: ParsedCommandLine) {
    return {
      ...config,
      options: this.normalizeOptions(config.options)
    };
  }

  private normalizeOptions(options: CompilerOptions): CompilerOptions {
    let compiler = this.plugin.compiler.instance;

    // FORCE ESNEXT?

    // Module
    // let modules = compiler.ModuleKind;
    // if (!options.module) options.module = modules.ESNext;
    // else if (![modules.ES2015, modules.ES2020, modules.ES2022, modules.ESNext].includes(options.module)) {
    //   this.plugin.logger.error(
    //     `Module kind "${
    //       compiler.ModuleKind[options.module]
    //     }" is incompatible with rollup. Use one of "ES2015", "ES2020", "ES2022" or "ESNext".`
    //   );
    //   exit();
    // }

    return {
      ...options,
      noEmit: false,
      noResolve: false,
      importHelpers: true,
      inlineSourceMap: false
    };
  }
}
