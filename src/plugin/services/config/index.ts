import type { Plugin } from "../..";
import type { CompilerOptions, ModuleKind } from "typescript";
import type { State, Diagnostics } from "./types";

import { exit } from "../../util/process";
import { apply } from "../../util/ansi";
import { isPath, normalize } from "../../util/path";
import { dirname, isAbsolute, join, resolve } from "path";

export class Config {
  readonly path: string;
  private base: string;

  private state!: State;
  private diagnostics!: Diagnostics;

  private supportedModuleKinds: ModuleKind[];

  constructor(private plugin: Plugin, input: string) {
    this.path = normalize(this.find(input));
    this.base = this.plugin.context ?? dirname(this.path);
    this.supportedModuleKinds = this.getSupportedModuleKinds();
    this.load();
  }

  public get options() {
    return this.state.options;
  }

  public get rootFiles() {
    return this.state.rootFiles;
  }

  public get extends() {
    return this.state.extends;
  }

  public get references() {
    return this.state.references;
  }

  public get target() {
    return this.state.target;
  }

  public get header() {
    return [` • Using configuration at ${this.plugin.logger.formatPath(this.path)}`];
  }

  public check() {
    for (let warning of this.diagnostics.warnings) this.plugin.logger.warn(warning);
    for (let error of this.diagnostics.errors) this.plugin.logger.error(error);
  }

  private find(input: string) {
    let compiler = this.plugin.compiler.instance,
      logger = this.plugin.logger;

    // Path
    if (isPath(input)) {
      let path = !isAbsolute(input) ? resolve(this.plugin.cwd, input) : input;
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

  private load() {
    let logger = this.plugin.logger,
      compiler = this.plugin.compiler.instance,
      diagnostics: Diagnostics = { warnings: [], errors: [] };

    // Read
    let source = compiler.readJsonConfigFile(this.path, compiler.sys.readFile);
    if (!source) {
      logger.error({ message: "Failed to read configuration.", path: this.path });
      exit();
    }

    // Parse
    let config = compiler.parseJsonSourceFileConfigFileContent(source, compiler.sys, this.base);
    for (let error of config.errors) diagnostics.errors.push(logger.diagnostics.getRecord(error));

    // Options
    let options: CompilerOptions = {
      ...config.options,
      noEmit: false,
      noResolve: false,
      skipLibCheck: true,
      importHelpers: true,
      inlineSourceMap: false
    };

    // Module
    if (options.module === undefined) options.module = compiler.ModuleKind.ESNext;
    else if (!this.supportedModuleKinds.includes(options.module)) {
      let names = this.supportedModuleKinds.map(kind => compiler.ModuleKind[kind]).join(", ");
      diagnostics.errors.push({
        message: `Unsupported module kind: ${compiler.ModuleKind[options.module]}.`,
        description: [
          "Rollup requires TypeScript to produce files using the ES Modules syntax.",
          `Use one of the available ES Modules options: ${names}.`
        ]
      });
    }

    // Save
    this.diagnostics = diagnostics;
    this.state = {
      source,
      options,
      target: compiler.getEmitScriptTarget(options),
      extends: source.extendedSourceFiles ?? [],
      rootFiles: config.fileNames,
      references: config.projectReferences ?? []
    };
  }

  public update() {
    this.load();
    this.plugin.resolver.update();
    this.plugin.program.update();
  }

  public updateRootFiles() {
    let compiler = this.plugin.compiler.instance;
    this.state.rootFiles = compiler.getFileNamesFromConfigSpecs(
      this.state.source.configFileSpecs!,
      this.base,
      this.state.options,
      compiler.sys,
      []
    );
    this.plugin.program.update();
  }

  private getSupportedModuleKinds() {
    let ModuleKind = this.plugin.compiler.instance.ModuleKind,
      final: ModuleKind[] = [];
    for (let key in ModuleKind) {
      let value = ModuleKind[key];
      if (typeof value !== "number") continue;
      if (value >= ModuleKind.ES2015 && value <= ModuleKind.ESNext) final.push(value);
    }
    return final;
  }
}
