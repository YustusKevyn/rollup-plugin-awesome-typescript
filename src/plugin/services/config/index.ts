import type { Plugin } from "../..";
import type { Diagnostics, State, Store } from "./types";
import type { CompilerOptions, ModuleKind, ParseConfigHost } from "typescript";

import { dirname, isAbsolute, join, resolve } from "path";
import { isPath, isSubPath, normalize } from "../../../util/path";
import { fileExists, isCaseSensitive } from "../../../util/fs";
import { concat } from "../../../util/data";

export class Config {
  private state!: State;
  private diagnostics!: Diagnostics;

  public store!: Store;

  constructor(private plugin: Plugin) {}

  public init() {
    if (!this.state && !this.load()) return false;

    this.plugin.logger.log(` • Using TSConfig at ${this.plugin.logger.formatPath(this.state.path)}`);
    return true;
  }

  public check() {
    for (let info of this.diagnostics.infos) this.plugin.logger.info(info);
    for (let warning of this.diagnostics.warnings) this.plugin.logger.warn(warning);
    for (let error of this.diagnostics.errors) this.plugin.logger.error(error);
  }

  public update() {
    let compiler = this.plugin.compiler.instance,
      oldOptions = this.store.options;

    if (!fileExists(this.state.path)) {
      this.diagnostics.errors.push({ message: "Configuration file does not exist anymore.", path: this.state.path });
      return;
    }
    this.load();

    let { options } = this.store;
    console.log(compiler.compilerOptionsAffectEmit(options, oldOptions));
    if (compiler.changesAffectModuleResolution(oldOptions, options)) this.plugin.resolver.update();
    if (compiler.compilerOptionsAffectEmit(options, oldOptions)) this.plugin.emitter.declarations.all = true;
    this.plugin.program.update();
  }

  public updateFiles() {
    let compiler = this.plugin.compiler.instance;
    this.plugin.filter.roots = this.plugin.resolver.toPaths(
      compiler.getFileNamesFromConfigSpecs(
        this.store.source.configFileSpecs!,
        this.state.base,
        this.store.options,
        this.state.host,
        []
      ),
      this.rootFilter
    );
    this.plugin.program.update();
  }

  private rootFilter = (path: string) => {
    if (this.store.declarations && isSubPath(path, this.store.declarations)) return false;
    return true;
  };

  private load() {
    let input = this.plugin.options.config ?? "tsconfig.json",
      logger = this.plugin.logger,
      path;

    // Path
    if (isPath(input)) {
      path = !isAbsolute(input) ? resolve(this.plugin.cwd, input) : input;
      if (!fileExists(path)) {
        logger.error({ message: "TSConfig file does not exist.", path: path });
        return false;
      }
    }

    // Filename
    else {
      let dir = this.plugin.cwd,
        parent = dirname(dir);

      while (dir !== parent) {
        let check = join(dir, input);
        if (fileExists(check)) {
          path = check;
          break;
        }

        dir = parent;
        parent = dirname(dir);
      }

      if (!path) {
        logger.error({ message: `TSConfig file with name "${input}" does not exist in directory tree.` });
        return false;
      }
    }

    // Save
    this.state = {
      path: normalize(path),
      base: this.plugin.context ?? dirname(path),
      host: this.createHost(),
      supportedModuleKinds: this.getSupportedModuleKinds()
    };
    this.parse();
    return true;
  }

  private parse() {
    let compiler = this.plugin.compiler.instance;
    this.diagnostics = { errors: [], warnings: [], infos: [] };

    let source = compiler.readJsonConfigFile(this.state.path, compiler.sys.readFile),
      config = compiler.parseJsonSourceFileConfigFileContent(source, this.state.host, this.state.base);
    for (let error of config.errors) this.diagnostics.errors.push(this.plugin.diagnostics.toRecord(error));

    let options = this.normalizeOptions(config.options),
      declarations = options.declaration ? (options.declarationDir || options.outDir)! : false;

    this.store = {
      source,
      options,
      declarations,
      target: compiler.getEmitScriptTarget(options),
      references: config.projectReferences ?? []
    };

    // Files
    this.plugin.filter.roots = this.plugin.resolver.toPaths(config.fileNames, this.rootFilter);
    this.plugin.filter.configs = this.plugin.resolver.toPaths(concat([this.state.path], source.extendedSourceFiles));
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
    options.importHelpers = true;
    options.isolatedModules = true;
    options.inlineSourceMap = false;
    options.suppressOutputPathCheck = true;

    delete options.out;
    delete options.outFile;

    // Module
    if (options.module === undefined) options.module = compiler.ModuleKind.ESNext;
    else if (!this.state.supportedModuleKinds.includes(options.module)) {
      let names = this.state.supportedModuleKinds.map(kind => compiler.ModuleKind[kind]).join(", ");
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
      } else if (declarations === true && options.declarationDir === undefined && options.outDir === undefined) {
        options.declaration = false;
        this.diagnostics.warnings.push({
          message:
            'The output of declaration files is disabled. Although "declarations" is set to `true` in the plugin options, no output directory was specified.',
          description:
            'Specify "outDir" or "declarationDir" in the TSConfig or replace "declarations" in the plugin options with an output directory.'
        });
      } else options.declaration = declarations;
    } else if (options.declaration === true && options.declarationDir === undefined && options.outDir === undefined) {
      options.declaration = false;
      this.diagnostics.warnings.push({
        message:
          'The output of declaration files is disabled. Although "declaration" is set to `true` in the TSConfig, no output directory was specified.',
        description: [
          'Specify an output directory using "declarationDir" or "outDir" in the TSConfig or "declarations" in the plugin options.',
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

    return options;
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
