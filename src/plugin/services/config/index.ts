import type { Plugin } from "../..";

import type { CompilerOptions, ModuleKind, ParseConfigHost } from "typescript";
import type { State, Diagnostics } from "./types";

import { exit } from "../../../util/process";
import { isPath, normalize } from "../../../util/path";
import { dirname, isAbsolute, join, resolve } from "path";
import { isCaseSensitive } from "../../../util/fs";

export class Config {
  private path: string;
  private base: string;

  private host: ParseConfigHost;
  private supportedModuleKinds: ModuleKind[];

  private state!: State;
  private diagnostics!: Diagnostics;

  constructor(private plugin: Plugin) {
    this.path = normalize(this.find());
    this.base = this.plugin.context ?? dirname(this.path);

    this.host = this.createHost();
    this.supportedModuleKinds = this.getSupportedModuleKinds();

    this.load();
  }

  public get header() {
    return [` • Using configuration at ${this.plugin.logger.formatPath(this.path)}`];
  }

  public get options() {
    return this.state.options;
  }

  public get target() {
    return this.state.target;
  }

  public get references() {
    return this.state.references;
  }

  public get rootFiles() {
    return this.state.rootFiles;
  }

  public get configFiles() {
    return this.state.configFiles;
  }

  private find() {
    let input = this.plugin.options.config ?? "tsconfig.json",
      compiler = this.plugin.compiler.instance,
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

      logger.error(`Configuration file with name "${input}" does not exist in directory tree.`);
      exit();
    }
  }

  private load() {
    let logger = this.plugin.logger,
      compiler = this.plugin.compiler.instance;
    this.diagnostics = { errors: [], warnings: [], infos: [] };

    // Read
    let source = compiler.readJsonConfigFile(this.path, compiler.sys.readFile);
    if (!source) {
      logger.error({ message: "Failed to read configuration.", path: this.path });
      exit();
    }

    // Parse
    let config = compiler.parseJsonSourceFileConfigFileContent(source, this.host, this.base);
    for (let error of config.errors) this.diagnostics.errors.push(logger.diagnostics.getRecord(error));
    this.normalizeOptions(config.options);

    // Save
    this.state = {
      source,
      target: compiler.getEmitScriptTarget(config.options),
      options: config.options,
      references: config.projectReferences ?? [],
      rootFiles: config.fileNames,
      configFiles: [this.path, ...(source.extendedSourceFiles ?? [])]
    };
  }

  private normalizeOptions(options: CompilerOptions) {
    let { buildInfo, declarations } = this.plugin.options,
      compiler = this.plugin.compiler.instance;

    // Force
    options.noEmit = false;
    options.noEmitOnError = false;
    options.noEmitHelpers = false;
    options.noResolve = false;
    options.incremental = true;
    // options.skipLibCheck = true;
    options.importHelpers = true;
    options.inlineSourceMap = false;

    // Resolution
    // if (options.moduleResolution === compiler.ModuleResolutionKind.Classic) {
    //   this.diagnostics.errors.push({
    //     message: `Unsupported module resolution kind: ${compiler.ModuleKind[options.moduleResolution]}.`,
    //     description: [
    //       "Rollup requires TypeScript to produce files using the ES Modules syntax.",
    //       `Set "module" in the TSConfig to one of the available ES Modules options: ${names}.`
    //     ]
    //   });
    // }

    // Module
    if (options.module === undefined) options.module = compiler.ModuleKind.ESNext;
    else if (!this.supportedModuleKinds.includes(options.module)) {
      let names = this.supportedModuleKinds.map(kind => compiler.ModuleKind[kind]).join(", ");
      this.diagnostics.errors.push({
        message: `Unsupported module kind: ${compiler.ModuleKind[options.module]}.`,
        description: [
          "Rollup requires TypeScript to produce files using the ES Modules syntax.",
          `Set "module" in the TSConfig to one of the available ES Modules options: ${names}.`
        ]
      });
    }

    // Declarations
    if (declarations !== undefined) {
      if (typeof declarations === "string") {
        options.declaration = true;
        if (isAbsolute(declarations)) options.declarationDir = declarations;
        else options.declarationDir = resolve(this.plugin.cwd, declarations);
      } else if (declarations === true && options.declarationDir === undefined) {
        options.declaration = false;
        this.diagnostics.warnings.push({
          message:
            'The output of declaration files is disabled. Although "declarations" is set to `true` in the plugin options, no output directory was specified.',
          description:
            'Specify "declarationDir" in the TSConfig or replace "declarations" in the plugin options with an output directory.'
        });
      } else options.declaration = declarations;
    } else if (options.declaration === true && options.declarationDir === undefined) {
      options.declaration = false;
      this.diagnostics.warnings.push({
        message:
          'The output of declaration files is disabled. Although "declaration" is set to `true` in the TSConfig, no output directory was specified.',
        description: [
          'Specify an output directory using "declarationDir" in the TSConfig or "declarations" in the plugin options.',
          'You can silence this warning by explicitly setting "declarations" to `false` in the plugin options.'
        ]
      });
    }

    // Build Info
    if (buildInfo !== undefined) {
      if (buildInfo === false) delete options.tsBuildInfoFile;
      else if (buildInfo === true && options.tsBuildInfoFile === undefined) buildInfo = ".tsbuildinfo";

      if (typeof buildInfo === "string") {
        if (isAbsolute(buildInfo)) options.tsBuildInfoFile = buildInfo;
        else options.tsBuildInfoFile = resolve(this.plugin.cwd, buildInfo);
      }
    } else if (options.tsBuildInfoFile === undefined) {
      this.diagnostics.infos.push({
        message:
          "It is recommended to specify a file for storing incremental compilation information to reduce rebuild time.",
        description: [
          'Specify "tsBuildInfoFile" in the TSConfig or "buildInfo" in the plugin options.',
          'You can silence this message by explicitly setting "buildInfo" to `false` in the plugin options.'
        ]
      });
    }
  }

  public update() {
    let compiler = this.plugin.compiler.instance,
      oldOptions = this.state.options;

    this.load();
    this.plugin.filter.update();
    if (compiler.changesAffectModuleResolution(oldOptions, this.state.options)) this.plugin.resolver.update();
    this.plugin.program.update();
  }

  public updateRootFiles() {
    let compiler = this.plugin.compiler.instance;
    this.state.rootFiles = compiler.getFileNamesFromConfigSpecs(
      this.state.source.configFileSpecs!,
      this.base,
      this.state.options,
      this.host,
      []
    );
    this.plugin.filter.updateFiles();
    this.plugin.program.update();
  }

  public check() {
    for (let info of this.diagnostics.infos) this.plugin.logger.info(info);
    for (let warning of this.diagnostics.warnings) this.plugin.logger.warn(warning);
    for (let error of this.diagnostics.errors) this.plugin.logger.error(error);
  }

  private createHost(): ParseConfigHost {
    let sys = this.plugin.compiler.instance.sys;
    return {
      fileExists: sys.fileExists,
      readDirectory: sys.readDirectory,
      readFile: sys.readFile,
      useCaseSensitiveFileNames: isCaseSensitive
    };
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
