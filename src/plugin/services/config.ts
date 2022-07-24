import type { Plugin } from "..";
import type { CompilerOptions } from "typescript";

import path from "path";
import { exit } from "../util/process";
import { ModuleKind } from "typescript";
import { isRelative } from "../util/path";

const acceptedModuleKinds = [
  ModuleKind.ES2015,
  ModuleKind.ES2020,
  ModuleKind.ES2022,
  ModuleKind.ESNext
];

export class ConfigService {
  readonly file: string;
  readonly options: CompilerOptions;

  constructor(private plugin: Plugin, input?: string) {
    this.file = this.find(input ?? "tsconfig.json");
    this.options = this.normalizeOptions(this.parse(this.file).options);
  }

  private find(file: string) {
    let compiler = this.plugin.compiler.instance,
      logger = this.plugin.logger;

    // Absolute path
    if (path.isAbsolute(file)) {
      if (compiler.sys.fileExists(file)) return file;
      logger.error({ message: "Configuration file does not exist.", file });
    }

    // Relative path
    else if (isRelative(file)) {
      let resolved = path.resolve(this.plugin.cwd, file);
      if (!compiler.sys.fileExists(resolved)) {
        logger.error({
          message: `Configuration file does not exists (resolved from ${logger.applyColor(
            "cyan",
            file
          )}).`,
          file: resolved
        });
        exit();
      }
      file = resolved;
    }

    // Filename
    else {
      let dir = this.plugin.cwd;
      while (true) {
        let joined = path.join(dir, file);
        if (compiler.sys.fileExists(joined)) {
          file = joined;
          break;
        }

        let parent = path.dirname(dir);
        if (parent === dir) {
          logger.error(
            `Configuration file with name ${logger.applyColor(
              "cyan",
              file
            )} does not exist in directory tree.`
          );
          break;
        }
        dir = parent;
      }
    }
    logger.info(
      `Using configuration at ${logger.applyColor(
        "cyan",
        path.relative(this.plugin.cwd, file)
      )}.`
    );
    return file;
  }

  private parse(file: string) {
    let logger = this.plugin.logger,
      compiler = this.plugin.compiler.instance,
      data = compiler.readConfigFile(file, compiler.sys.readFile);

    if (data.error) {
      logger.error({ message: "Failed to read configuration file.", file });
      logger.diagnostic(data.error);
      exit();
    }

    let result = compiler.parseJsonConfigFileContent(
      data.config,
      compiler.sys,
      this.plugin.context ?? path.dirname(file)
    );

    if (result.errors.length) {
      logger.error({ message: "Failed to parse configuration file.", file });
      logger.diagnostic(result.errors);
      exit();
    }
    return result;
  }

  private normalizeOptions(options: CompilerOptions): CompilerOptions {
    // Module
    if (!options.module) options.module = ModuleKind.ESNext;
    else if (!acceptedModuleKinds.includes(options.module)) {
      if (options.module)
        this.plugin.logger.error(
          `Module kind "${
            ModuleKind[options.module]
          }" is incompatible with rollup. Use one of "ES2015", "ES2020", "ES2022" or "ESNext".`
        );
      exit();
    }

    return {
      ...options,
      noEmit: false,
      noResolve: false,
      importHelpers: true,
      emitDeclarationOnly: false
    };
  }
}
