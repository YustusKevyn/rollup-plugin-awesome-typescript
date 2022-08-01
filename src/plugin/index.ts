import type { Options, State } from "./types";
import type { LoadResult, NormalizedInputOptions, PluginContext } from "rollup";

import { Logger, LoggerLevel } from "./services/logger";
import { Compiler } from "./services/compiler";
import { Helpers } from "./services/helpers";
import { Config } from "./services/config";
import { Filter } from "./services/filter";
import { Resolver } from "./services/resolver";
import { Watcher } from "./services/watcher";
import { Program } from "./services/program";

import { trueCase, normalize } from "./util/path";

export class Plugin {
  private state: State;

  readonly cwd: string = normalize(process.cwd());
  readonly context?: string;

  readonly logger: Logger;

  readonly compiler: Compiler;
  readonly helpers: Helpers;
  readonly config: Config;

  readonly filter: Filter;
  readonly resolver: Resolver;
  readonly watcher: Watcher;

  readonly program: Program;

  constructor(options: Options) {
    if (options.cwd) this.cwd = normalize(options.cwd, this.cwd);
    if (options.context) this.context = normalize(options.context, this.cwd);

    let logLevel = options.silent ? -1 : options.logLevel ?? LoggerLevel.Info;
    this.logger = new Logger(this, logLevel);

    this.compiler = new Compiler(this, options.compiler ?? "typescript");
    this.helpers = new Helpers(this, options.helpers ?? "tslib");
    this.config = new Config(this, options.config ?? "tsconfig.json");

    this.filter = new Filter(this);
    this.resolver = new Resolver(this);
    this.watcher = new Watcher(this);

    this.program = new Program(this);

    // State
    this.state = {
      cycle: 0,
      entries: new Set()
    };
  }

  public start(context: PluginContext, options: NormalizedInputOptions) {
    this.compiler.log();
    this.helpers.log();
    this.config.log();

    this.state.cycle++;

    // Incremental
    if (this.state.cycle > 1) {
      this.config.updateFiles();
      this.watcher.flush();

      for (let entry of this.state.entries) {
        let dependencies = this.program.getDependencies(entry);
        for (let dependency of dependencies) context.addWatchFile(trueCase(dependency));
      }

      console.log(context.getWatchFiles());
    }
  }

  public resolve(context: PluginContext, id: string, origin: string | undefined, isRoot: boolean) {
    if (id === "tslib") return this.helpers.path;
    if (!origin) return null;

    // // Entry
    // if (info?.isEntry && included) {
    //   if (!this.state.entries.has(path)) {
    //     this.state.entries.add(path);
    //     let dependencies = this.program.getDependencies(path);
    //     for (let dependency of dependencies) context.addWatchFile(trueCase(dependency));
    //   }
    // } else this.state.entries.delete(path);

    // ADD ROOTS TO GRAPH!
    // (FILES THAT ARE RESOLVED FROM AN ORIGIN NOT WITHIN TYPESCRIPT'S REACH)

    let path = this.resolver.resolvePath(id, origin);
    if (!path || !this.filter.includes(path)) return null;
    return trueCase(path);
  }

  public process(id: string) {
    let path = this.resolver.toPath(id);
    if (!this.filter.includes(path)) return null;

    let output = this.program.getOutput(path);
    if (!output?.code) return null;

    let result: LoadResult = { code: output.code };
    if (output.codeMap) result.map = JSON.parse(output.codeMap);
    return result;
  }

  public end() {
    this.program.check();
  }
}
