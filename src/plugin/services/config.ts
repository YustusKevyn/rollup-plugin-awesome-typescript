import type { Plugin } from "..";
import type { CompilerOptions, ParsedCommandLine } from "typescript";

import { exit } from "../util/process";
import { apply } from "../util/ansi";
import { isPath, isRelative } from "../util/path";
import { dirname, join, resolve } from "path";

export class Config {
  public path: string;
  public options: CompilerOptions;

  constructor(private plugin: Plugin, input: string) {
    this.path = this.find(input);
    this.options = this.load(this.path).options;
  }

  public log() {
    let logger = this.plugin.logger;
    logger.info(`Using configuration at ${logger.formatPath(this.path)}`);
  }

  public update() {
    let config = this.load(this.path);
    this.options = config.options;
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

  private load(path: string) {
    let logger = this.plugin.logger,
      compiler = this.plugin.compiler.instance;

    // Read
    let data = compiler.readConfigFile(path, compiler.sys.readFile);
    if (data.error) {
      logger.diagnostics.print(data.error);
      exit();
    }

    // Parse
    let config = compiler.parseJsonConfigFileContent(data, compiler.sys, this.plugin.context ?? dirname(path));
    if (config.errors.length) {
      logger.diagnostics.print(config.errors);
      exit();
    }

    // Normalize
    let options = config.options;
    options.noEmit = false;
    options.noResolve = false;
    options.importHelpers = true;
    options.inlineSourceMap = false;
    return config;
  }
}
