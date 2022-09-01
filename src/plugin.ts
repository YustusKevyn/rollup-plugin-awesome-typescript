import type { Options } from "./types";
import type { LoadResult, MinimalPluginContext, PluginContext } from "rollup";

import { Builder } from "./services/builder";
import { Checker } from "./services/checker";
import { Config } from "./services/config";
import { Compiler } from "./services/compiler";
import { Diagnostics } from "./services/diagnostics";
import { Emitter } from "./services/emitter";
import { Filter } from "./services/filter";
import { Helpers } from "./services/helpers";
import { Logger } from "./services/logger";
import { Program } from "./services/program";
import { Resolver } from "./services/resolver";
import { Tracker } from "./services/tracker";
import { Watcher } from "./services/watcher";

import { EmptyLine, PluginMode } from "./constants";

import { apply, Mode } from "./util/ansi";
import { normalise, trueCase } from "./util/path";

export class Plugin {
  public loaded: boolean = false;
  public mode: PluginMode = PluginMode.Build;

  readonly cwd: string = normalise(process.cwd());
  readonly context?: string;

  readonly logger: Logger;
  readonly tracker = new Tracker(this);
  readonly diagnostics = new Diagnostics(this);

  readonly compiler = new Compiler(this);
  readonly helpers = new Helpers(this);
  readonly config = new Config(this);

  readonly resolver = new Resolver(this);
  readonly filter = new Filter(this);
  readonly watcher = new Watcher(this);

  readonly program = new Program(this);
  readonly builder = new Builder(this);
  readonly checker = new Checker(this);
  readonly emitter = new Emitter(this);

  constructor(readonly options: Options) {
    this.logger = new Logger(this, options.logLevel);
    if (options.cwd) this.cwd = normalise(options.cwd, this.cwd);
    if (options.context) this.context = normalise(options.context, this.cwd);
  }

  public init(context: MinimalPluginContext) {
    if (context.meta.watchMode) this.mode = PluginMode.Watch;

    this.tracker.reset();
    this.logger.log([EmptyLine, apply("Awesome TypeScript v" + VERSION, Mode.Underline)]);

    let core = this.compiler.init() && this.helpers.init() && this.config.init();
    if (!core) {
      this.tracker.print();
      throw {
        plugin: "Awesome Typescript",
        message: "Compilation failed. Check the error messages above.",
        stack: undefined
      };
    }

    if (!this.loaded) {
      this.resolver.init();
      this.program.init();
      this.loaded = true;
    }
  }

  public start(context: PluginContext) {
    this.watcher.update();
    for (let path of this.filter.configs) context.addWatchFile(trueCase(path));
  }

  public resolve(id: string, origin?: string) {
    if (id === "tslib") return this.helpers.path;
    if (!origin) return null;

    let path = this.resolver.resolvePath(id, origin);
    if (!path || !this.filter.isModule(path)) return null;
    return trueCase(path);
  }

  public process(id: string) {
    let path = this.resolver.toPath(id);
    if (!this.filter.isModule(path)) return null;

    // Output
    let output = this.builder.getModule(path);
    if (!output) return null;

    // Result
    let result: LoadResult = { code: output.text };
    if (output.map) result.map = JSON.parse(output.map);
    return result;
  }

  public end(context: PluginContext) {
    let files = this.builder.build(context);

    // Check
    this.config.check();
    if (this.options.check !== false) this.checker.check(files);

    // No emit
    if (this.config.options.noEmitOnError && this.tracker.errors) {
      this.tracker.print(true);
      throw {
        plugin: "Awesome Typescript",
        message: "Compilation failed. Check the error messages above.",
        watchFiles: context.getWatchFiles(),
        stack: undefined
      };
    }

    // Emit
    this.emitter.emit(files);
    this.tracker.print(true);
  }
}
