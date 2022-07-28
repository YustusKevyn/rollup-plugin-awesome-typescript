import type { Plugin } from "..";
import type { CompilerOptions, ParsedCommandLine } from "typescript";

import { exit } from "../util/process";
import { apply } from "../util/ansi";
import { isPath, isRelative } from "../util/path";
import { dirname, join, resolve } from "path";

export class Config {
  readonly path: string;
  readonly options: CompilerOptions;

  constructor(private plugin: Plugin, input: string) {
    this.path = this.find(input);

    let source = this.read(this.path),
      config = this.parse(this.path, source);
    this.options = this.normalize(config).options;
  }

  log() {
    let logger = this.plugin.logger;
    logger.info(`Using configuration at ${logger.formatPath(this.path)}`);
  }

  private find(input: string) {
    let compiler = this.plugin.compiler.instance,
      logger = this.plugin.logger;

    // Path
    if (isPath(input)) {
      let path = isRelative(input) ? resolve(this.plugin.cwd, input) : input;
      if (!compiler.sys.fileExists(path)) {
        logger.error({ message: "Configuration file does not exists.", path: path });
        exit();
      }
      return path;
    }

    // Filename
    else {
      let dir = this.plugin.cwd,
        parent = dirname(dir);

      while (dir !== parent) {
        let path = join(dir, input);
        if (compiler.sys.fileExists(path)) return path;

        dir = parent;
        parent = dirname(dir);
      }

      logger.error(`Configuration file with name ${apply(input, "yellow")} does not exist in directory tree.`);
      exit();
    }
  }

  private read(path: string) {
    let logger = this.plugin.logger,
      compiler = this.plugin.compiler.instance,
      data = compiler.readConfigFile(path, compiler.sys.readFile);

    if (data.error) {
      logger.diagnostics.print(data.error);
      exit();
    }
    return data.config;
  }

  private parse(path: string, source: string) {
    let logger = this.plugin.logger,
      compiler = this.plugin.compiler.instance,
      result = compiler.parseJsonConfigFileContent(source, compiler.sys, this.plugin.context ?? dirname(path));

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
