import type { Options } from "../types";
import type { LoadResult, PluginContext } from "rollup";

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

import { apply } from "../util/ansi";
import { EmptyLine } from "./constants";
import { normalise, trueCase } from "../util/path";

export class Plugin {
  private state = {
    cycle: 0,
    initialised: false
  };

  readonly cwd: string = normalise(process.cwd());
  readonly context?: string;

  readonly logger = new Logger(this);
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
    if (options.cwd) this.cwd = normalise(options.cwd, this.cwd);
    if (options.context) this.context = normalise(options.context, this.cwd);
  }

  public init() {
    this.tracker.reset();
    this.logger.log([EmptyLine, apply("Awesome TypeScript", "underline")]);

    let core = this.compiler.init() && this.helpers.init() && this.config.init();
    if (!core) {
      this.tracker.print();
      throw new Error();
    }

    if (!this.state.initialised) {
      this.resolver.init();
      this.program.init();
      this.state.initialised = true;
    }
  }

  public start(context: PluginContext) {
    this.state.cycle++;
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
    let output = this.builder.getJs(path);
    if (!output?.text) return null;

    // Result
    let result: LoadResult = { code: output.text };
    if (output.map) result.map = JSON.parse(output.map);
    return result;
  }

  public end(context: PluginContext) {
    let files = this.builder.build(context);
    if (this.options.check !== false) this.checker.check(files);
    this.emitter.emit(files);
    this.tracker.print(true);
  }
}
