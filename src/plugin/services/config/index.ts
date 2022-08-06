import type { Plugin } from "../..";

import type { CompilerOptions, ModuleKind, ParseConfigHost } from "typescript";
import type { State, Diagnostics, Fallback } from "./types";

import { exit } from "../../util/process";
import { isPath, normalize } from "../../util/path";
import { dirname, isAbsolute, join, resolve } from "path";
import { isCaseSensitive } from "../../util/fs";

export class Config {
  readonly path: string;
  private base: string;

  private host: ParseConfigHost;
  private fallback: Fallback;
  private supportedModuleKinds: ModuleKind[];

  private state!: State;
  private diagnostics!: Diagnostics;

  constructor(private plugin: Plugin) {
    this.path = normalize(this.find());
    this.base = this.plugin.context ?? dirname(this.path);

    this.host = this.createHost();
    this.fallback = this.createFallback();
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
    for (let info of this.diagnostics.infos) this.plugin.logger.info(info);
    for (let warning of this.diagnostics.warnings) this.plugin.logger.warn(warning);
    for (let error of this.diagnostics.errors) this.plugin.logger.error(error);
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
      compiler = this.plugin.compiler.instance,
      diagnostics: Diagnostics = { errors: [], warnings: [], infos: [] };

    // Read
    let source = compiler.readJsonConfigFile(this.path, compiler.sys.readFile);
    if (!source) {
      logger.error({ message: "Failed to read configuration.", path: this.path });
      exit();
    }

    // Parse
    let config = compiler.parseJsonSourceFileConfigFileContent(source, this.host, this.base);
    for (let error of config.errors) diagnostics.errors.push(logger.diagnostics.getRecord(error));

    // Options
    let options: CompilerOptions = {
      ...config.options,
      noEmit: false,
      noResolve: false,
      incremental: true,
      skipLibCheck: true,
      importHelpers: true,
      inlineSourceMap: false
    };

    if (!options.tsBuildInfoFile) {
      if (this.fallback.buildInfoFile) options.tsBuildInfoFile = this.fallback.buildInfoFile;
      else if (this.plugin.options.buildInfo !== false) {
        diagnostics.infos.push({
          message:
            "It is recommended to specify a file for storing incremental compilation information to reduce rebuild time.",
          description: [
            'Specify "tsBuildInfoFile" in the TSConfig or "buildInfo" in the plugin options.',
            'You can silence this message by explicitly setting "buildInfo" to `false` in the plugin options.'
          ]
        });
      }
    }

    if (!options.declarationDir) {
      if (this.fallback.declarationDir) options.declarationDir = this.fallback.declarationDir;
      else if (options.declaration && this.plugin.options.declarations !== false) {
        diagnostics.warnings.push({
          message:
            'Skipping the output of declaration files. Although "declaration" is set to `true` in the TSConfig, no output directory was specified.',
          description: [
            'Specify "declarationDir" in the TSConfig or "declarations" in the plugin options.',
            'You can silence this warning by explicitly setting "declarations" to `false` in the plugin options.'
          ]
        });
      }
    }

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
    this.plugin.filter.update();
    this.plugin.resolver.update();
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
    this.plugin.filter.update();
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

  private createHost(): ParseConfigHost {
    let sys = this.plugin.compiler.instance.sys;
    return {
      fileExists: sys.fileExists,
      readDirectory: sys.readDirectory,
      readFile: sys.readFile,
      useCaseSensitiveFileNames: isCaseSensitive
    };
  }

  private createFallback() {
    let { declarations, buildInfo } = this.plugin.options,
      fallback: Fallback = {};

    // Declarations
    if (declarations) {
      if (declarations === true) declarations = "lib/types";
      if (typeof declarations === "string") {
        if (isAbsolute(declarations)) fallback.declarationDir = declarations;
        else fallback.declarationDir = resolve(this.plugin.cwd, declarations);
      }
    }

    // Build Info
    if (buildInfo) {
      if (buildInfo === true) buildInfo = ".tsbuildinfo";
      if (typeof buildInfo === "string") {
        if (isAbsolute(buildInfo)) fallback.buildInfoFile = buildInfo;
        else fallback.buildInfoFile = resolve(this.plugin.cwd, buildInfo);
      }
    }

    return fallback;
  }
}
