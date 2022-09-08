import type { Plugin } from "../plugin";
import type { Message, Record } from "../types";
import type {
  CompilerOptions,
  ConfigFileSpecs,
  ModuleKind,
  ParseConfigHost,
  ProjectReference,
  ScriptTarget,
  TsConfigSourceFile
} from "typescript";

import { dirname, isAbsolute, join, resolve } from "path";
import { RecordCategory } from "../constants";
import { concat } from "../util/data";
import { apply, Mode } from "../util/ansi";
import { isPath, isSubPath } from "../util/path";
import { fileExists, isCaseSensitive } from "../util/fs";

export class Config {
  public options!: CompilerOptions;
  public references!: Readonly<ProjectReference[]>;
  public resolved!: {
    target: ScriptTarget;
    declarations: string | false;
  };

  private loaded: boolean = false;
  private records: Record[] = [];
  private message!: Message;

  private host!: ParseConfigHost;
  private input!: {
    path?: string;
    base: string;
  };
  private source!: {
    specs: ConfigFileSpecs;
  };

  constructor(private plugin: Plugin) {}

  private filter = (path: string) => {
    if (this.resolved.declarations && isSubPath(path, this.resolved.declarations)) return false;
    return true;
  };

  public init() {
    if (!this.host) this.createHost();
    if (!this.input && !this.createInput()) return false;
    if (!this.loaded && !this.load()) return false;
    this.plugin.logger.log(this.message);
    return true;
  }

  public check() {
    for (let record of this.records) this.plugin.tracker.record(record);
  }

  public update() {
    let compiler = this.plugin.compiler.instance,
      oldOptions = this.options;

    // File
    if (this.input.path && !fileExists(this.input.path)) {
      this.records.push({
        category: RecordCategory.Error,
        message: "TSConfig file does not exist anymore.",
        path: this.input.path
      });
      return;
    }

    // Load
    this.load();
    if (compiler.changesAffectModuleResolution(oldOptions, this.options)) this.plugin.resolver.update();
    if (compiler.compilerOptionsAffectEmit(this.options, oldOptions)) {
      this.plugin.builder.invalidateDeclarations();
      this.plugin.emitter.declarations.all = true;
    }
    this.plugin.program.update();
  }

  public updateFiles() {
    let compiler = this.plugin.compiler.instance;
    this.plugin.filter.roots = this.plugin.resolver.toPaths(
      compiler.getFileNamesFromConfigSpecs(this.source.specs, this.input.base, this.options, this.host, []),
      this.filter
    );
    this.plugin.program.update();
  }

  private load() {
    this.records = [];

    let compiler = this.plugin.compiler.instance,
      source: TsConfigSourceFile;

    // Source
    if (this.input.path) source = compiler.readJsonConfigFile(this.input.path, compiler.sys.readFile);
    else source = compiler.parseJsonText("tsconfig.json", "");

    // Config
    let config = compiler.parseJsonSourceFileConfigFileContent(
      source,
      this.host,
      this.input.base,
      this.getCompilerOptions()
    );
    for (let error of config.errors) this.records.push(this.plugin.diagnostics.toRecord(error));

    // Save
    this.source = { specs: source.configFileSpecs! };
    this.options = this.normaliseCompilerOptions(config.options);
    this.references = config.projectReferences ?? [];
    this.resolved = {
      target: compiler.getEmitScriptTarget(this.options),
      declarations: this.options.declaration ? (this.options.declarationDir || this.options.outDir)! : false
    };

    // Files
    this.plugin.filter.roots = this.plugin.resolver.toPaths(config.fileNames, this.filter);
    this.plugin.filter.configs = this.plugin.resolver.toPaths(concat([], this.input.path, source.extendedSourceFiles));

    // Finalise
    this.message = this.input.path
      ? ` • Using TSConfig at ${this.plugin.logger.formatPath(this.input.path)}`
      : " • Using custom TSConfig";
    this.loaded = true;
    return true;
  }

  private getCompilerOptions() {
    let compiler = this.plugin.compiler.instance,
      json = this.plugin.options.compilerOptions ?? {};

    // Enums
    for (let option of compiler.optionDeclarations) {
      if (typeof json[option.name] !== "number" || !(option.type instanceof Map)) continue;
      for (let [str, num] of option.type.entries()) if (json[option.name] === num) json[option.name] = str;
    }

    // Convert
    let { errors, options } = compiler.convertCompilerOptionsFromJson(json, this.input.base);
    for (let error of errors) this.records.push(this.plugin.diagnostics.toRecord(error));

    // Override
    options.noEmit = false;
    options.noEmitHelpers = false;
    options.noResolve = false;
    options.incremental = true;
    options.importHelpers = true;
    options.inlineSourceMap = false;
    options.suppressOutputPathCheck = true;

    return options;
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

  private normaliseCompilerOptions(options: CompilerOptions) {
    let { buildInfo, declarations } = this.plugin.options,
      compiler = this.plugin.compiler.instance;

    delete options.out;
    delete options.outFile;

    // Module
    let supportedModuleKinds = this.getSupportedModuleKinds();
    if (options.module === undefined) options.module = compiler.ModuleKind.ESNext;
    else if (!supportedModuleKinds.includes(options.module)) {
      let names = supportedModuleKinds.map(kind => compiler.ModuleKind[kind]).join(", ");
      this.records.push({
        category: RecordCategory.Error,
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
        this.records.push({
          category: RecordCategory.Warning,
          message:
            'The output of declaration files is disabled. Although "declarations" is set to `true` in the plugin options, no output directory was specified.',
          description:
            'Specify "outDir" or "declarationDir" in the TSConfig or replace "declarations" in the plugin options with an output directory.'
        });
      } else options.declaration = declarations;
    } else if (options.declaration === true && options.declarationDir === undefined && options.outDir === undefined) {
      options.declaration = false;
      this.records.push({
        category: RecordCategory.Warning,
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
      this.records.push({
        category: RecordCategory.Hint,
        message:
          "It is recommended to specify a file for storing incremental compilation information to reduce rebuild time.",
        description: [
          'Specify "tsBuildInfoFile" in the TSConfig or "buildInfo" in the plugin options.',
          'You can silence this message by explicitly setting "buildInfo" to `false` in the plugin options.'
        ]
      });
    }

    // Lib Check
    if (options.skipLibCheck === undefined && options.skipDefaultLibCheck === undefined) {
      this.records.push({
        category: RecordCategory.Hint,
        message:
          "It is recommended to skip the type checking of declaration files, as it can significantly reduce the initial build time.",
        description: [
          'Set "skipLibCheck" to `true` in the TSConfig.',
          'You can silence this message by explicitly setting "skipLibCheck" to `false` in the TSConfig.'
        ]
      });
    }

    return options;
  }

  private createInput() {
    let input = this.plugin.options.config ?? "tsconfig.json",
      tracker = this.plugin.tracker;

    // Custom
    if (typeof input !== "string") {
      this.input = { base: this.plugin.context ?? this.plugin.cwd };
      return true;
    }

    // Path
    if (isPath(input)) {
      let path = !isAbsolute(input) ? resolve(this.plugin.cwd, input) : input;
      if (fileExists(path)) {
        this.input = { path, base: this.plugin.context ?? dirname(path) };
        return true;
      }

      tracker.recordError({ message: "TSConfig file does not exist.", path });
      return false;
    }

    // Filename
    let dir = this.plugin.cwd,
      parent = dirname(dir);

    while (dir !== parent) {
      let path = join(dir, input);
      if (fileExists(path)) {
        this.input = { path, base: this.plugin.context ?? dirname(path) };
        return true;
      }

      dir = parent;
      parent = dirname(dir);
    }

    tracker.recordError({
      message: `TSConfig file with name "${input}" does not exist in directory tree.`
    });
    return false;
  }

  private createHost() {
    let compiler = this.plugin.compiler.instance;
    this.host = {
      fileExists: compiler.sys.fileExists,
      readDirectory: compiler.sys.readDirectory,
      readFile: compiler.sys.readFile,
      useCaseSensitiveFileNames: isCaseSensitive
    };
  }
}
