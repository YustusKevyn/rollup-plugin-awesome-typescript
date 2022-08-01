import type { Plugin } from "..";
import type { CompilerOptions, ProjectReference, ScriptTarget, TsConfigSourceFile } from "typescript";

import { exit } from "../util/process";
import { apply } from "../util/ansi";
import { isPath, normalize } from "../util/path";
import { dirname, isAbsolute, join, resolve } from "path";

export class Config {
  private path: string;
  private base: string;

  public files!: string[];
  public source!: TsConfigSourceFile;
  public target!: ScriptTarget;
  public options!: CompilerOptions;
  public references!: Readonly<ProjectReference[]>;

  constructor(private plugin: Plugin, input: string) {
    this.path = normalize(this.find(input));
    this.base = this.plugin.context ?? dirname(this.path);
    this.load();
  }

  public log() {
    let logger = this.plugin.logger;
    logger.info(`Using configuration at ${logger.formatPath(this.path)}`);
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
      compiler = this.plugin.compiler.instance;

    // Read
    let source = (this.source = compiler.readJsonConfigFile(this.path, compiler.sys.readFile));
    if (!source) {
      logger.error({ message: "Failed to read configuration.", path: this.path });
      exit();
    }

    // Parse
    let config = compiler.parseJsonSourceFileConfigFileContent(source, compiler.sys, this.base);
    if (config.errors) logger.diagnostics.print(config.errors);

    // Options
    let options: CompilerOptions = {
      ...config.options,
      noEmit: false,
      noResolve: false,
      importHelpers: true,
      inlineSourceMap: false,
      moduleResolution: compiler.ModuleResolutionKind.NodeNext
    };
    if (options.module === undefined) options.module = compiler.ModuleKind.ESNext;

    // Save
    this.target = compiler.getEmitScriptTarget(options);
    this.options = options;
    this.files = config.fileNames;
    this.references = config.projectReferences ?? [];
  }

  public updateFiles() {
    let compiler = this.plugin.compiler.instance;
    this.files = compiler.getFileNamesFromConfigSpecs(
      this.source.configFileSpecs!,
      this.base,
      this.options,
      compiler.sys,
      []
    );
    this.plugin.program.updateBuilder();
  }
}
