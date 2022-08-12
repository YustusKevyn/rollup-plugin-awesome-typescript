import type { State } from "./types";
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
import { Watcher } from "./services/watcher";

import { apply } from "../util/ansi";
import { normalize, trueCase } from "../util/path";

export class Plugin {
  private state!: State;

  readonly cwd: string = normalize(process.cwd());
  readonly context?: string;

  readonly logger = new Logger(this);
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
    if (options.cwd) this.cwd = normalize(options.cwd, this.cwd);
    if (options.context) this.context = normalize(options.context, this.cwd);
  }

  public init() {
    this.logger.log([this.logger.PADDING, apply("Awesome TypeScript", "underline")]);
    let core = this.compiler.init() && this.helpers.init() && this.config.init();
    this.logger.log(this.logger.PADDING);

    if (!core) throw new Error();
    if (!this.state) {
      this.resolver.init();
      this.program.init();
      this.state = { cycle: 0 };
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
    let output = this.builder.getJsOutput(path);
    if (!output?.text) return null;

    // Result
    let result: LoadResult = { code: output.text };
    if (output.map) result.map = JSON.parse(output.map);
    return result;
  }

  public end(context: PluginContext) {
    let files = this.builder.build(context);
    this.emitter.emit(files);
    this.config.check();

    if (this.options.check !== false) {
      let result = this.checker.check(files);
      // x: 10 problems (10 errors, 2 warnings)
      // !: 2 problems (2 warnings)
      // v: 0 problems
    }
  }
}
