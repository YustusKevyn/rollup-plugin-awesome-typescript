import type { Plugin } from "../plugin";
import type { Record } from "../types";
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
import { isPath, isSubPath } from "../util/path";
import { fileExists, isCaseSensitive } from "../util/fs";
import { concat } from "../util/data";

export class Config {
  private loaded: boolean = false;
  private records: Record[] = [];

  private host!: ParseConfigHost;
  private file!: {
    path: string | undefined;
    base: string;
    specs: ConfigFileSpecs;
  };

  public options!: CompilerOptions;
  public references!: Readonly<ProjectReference[]>;
  public resolved!: {
    target: ScriptTarget;
    declarations: string | false;
  };

  constructor(private plugin: Plugin) {}

  public init() {
    if (!this.loaded && !this.load()) return false;
    let message = [];

    // Title
    if (this.file.path) message.push(` • Using TSConfig at ${this.plugin.logger.formatPath(this.file.path)}`);
    else message.push(" • Using TSConfig specified in the plugin options");

    // Finalise
    this.plugin.logger.log(message);
    return true;
  }

  public check() {
    for (let record of this.records) this.plugin.tracker.record(record);
  }

  public update() {
    let compiler = this.plugin.compiler.instance,
      oldOptions = this.options;

    // File
    if (this.file.path && !fileExists(this.file.path)) {
      this.records.push({
        category: RecordCategory.Error,
        message: "TSConfig file does not exist anymore.",
        path: this.file.path
      });
      return;
    }

    // Reload
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
      compiler.getFileNamesFromConfigSpecs(this.file.specs, this.file.base, this.options, this.host, []),
      this.rootFilter
    );
    this.plugin.program.update();
  }

  private rootFilter = (path: string) => {
    if (this.resolved.declarations && isSubPath(path, this.resolved.declarations)) return false;
    return true;
  };

  private load() {
    if (!this.host) this.host = this.createHost();
    this.records = [];

    let input = this.plugin.options.config ?? "tsconfig.json",
      compiler = this.plugin.compiler.instance,
      source: TsConfigSourceFile,
      path,
      base;

    // File
    if (typeof input === "string") {
      let found = this.find(input);
      if (!found) return false;

      path = this.plugin.resolver.toPath(found);
      base = this.plugin.context ?? dirname(path);
      source = compiler.readJsonConfigFile(path, compiler.sys.readFile);
    }

    // Custom
    else {
      let json = typeof input === "object" ? JSON.stringify(input) : "";
      base = this.plugin.context ?? this.plugin.cwd;
      source = compiler.parseJsonText("tsconfig.json", json);
    }

    // Config
    let config = compiler.parseJsonSourceFileConfigFileContent(source, this.host, base);
    for (let error of config.errors) this.records.push(this.plugin.diagnostics.toRecord(error));

    this.file = { path, base, specs: source.configFileSpecs! };
    this.options = this.normaliseOptions(config.options);
    this.references = config.projectReferences ?? [];
    this.resolved = {
      target: compiler.getEmitScriptTarget(this.options),
      declarations: this.options.declaration ? (this.options.declarationDir || this.options.outDir)! : false
    };

    // Files
    this.plugin.filter.roots = this.plugin.resolver.toPaths(config.fileNames, this.rootFilter);
    this.plugin.filter.configs = this.plugin.resolver.toPaths(concat([], this.file.path, source.extendedSourceFiles));

    // Finalise
    this.loaded = true;
    return true;
  }

  private find(input: string) {
    let tracker = this.plugin.tracker;

    // Path
    if (isPath(input)) {
      let path = !isAbsolute(input) ? resolve(this.plugin.cwd, input) : input;
      if (fileExists(path)) return path;
      tracker.recordError({ message: "TSConfig file does not exist.", path });
      return false;
    }

    // Filename
    let dir = this.plugin.cwd,
      parent = dirname(dir);

    while (dir !== parent) {
      let path = join(dir, input);
      if (fileExists(path)) return path;

      dir = parent;
      parent = dirname(dir);
    }

    tracker.recordError({
      message: `TSConfig file with name "${input}" does not exist in directory tree.`
    });
    return false;
  }

  private normaliseOptions(options: CompilerOptions) {
    let { buildInfo, declarations } = this.plugin.options,
      compiler = this.plugin.compiler.instance;

    // Force
    options.noEmit = false;
    options.noEmitHelpers = false;
    options.noResolve = false;
    options.incremental = true;
    options.importHelpers = true;
    options.inlineSourceMap = false;
    options.suppressOutputPathCheck = true;

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

  private createHost(): ParseConfigHost {
    let compiler = this.plugin.compiler.instance;
    return {
      fileExists: compiler.sys.fileExists,
      readDirectory: compiler.sys.readDirectory,
      readFile: compiler.sys.readFile,
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
