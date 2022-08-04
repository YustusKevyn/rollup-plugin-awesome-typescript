import type { Options } from "../types";
import type { LoadResult, NormalizedInputOptions, PluginContext } from "rollup";

import { Config } from "./services/config";
import { Compiler } from "./services/compiler";
import { Emitter } from "./services/emitter";
import { Filter } from "./services/filter";
import { Helpers } from "./services/helpers";
import { Logger, LoggerLevel } from "./services/logger";
import { Program } from "./services/program";
import { Resolver } from "./services/resolver";
import { Watcher } from "./services/watcher";

import { apply } from "./util/ansi";
import { trueCase, normalize } from "./util/path";

export class Plugin {
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
  readonly emitter: Emitter;

  constructor(options: Options) {
    if (options.cwd) this.cwd = normalize(options.cwd, this.cwd);
    if (options.context) this.context = normalize(options.context, this.cwd);

    this.logger = new Logger(this, LoggerLevel.Info);

    this.compiler = new Compiler(this, options.compiler ?? "typescript");
    this.helpers = new Helpers(this, options.helpers ?? "tslib");
    this.config = new Config(this, options.config ?? "tsconfig.json");

    this.filter = new Filter(this);
    this.resolver = new Resolver(this);
    this.watcher = new Watcher(this);

    this.program = new Program(this);
    this.emitter = new Emitter(this, options);
  }

  public resolve(id: string, origin?: string) {
    if (id === "tslib") return this.helpers.path;
    if (!origin) return null;

    let path = this.resolver.resolvePath(id, origin);
    if (!path || !this.filter.includes(path)) return null;
    return trueCase(path);
  }

  public process(id: string) {
    let path = this.resolver.toPath(id);
    if (!this.filter.includes(path)) return null;

    // Output
    let output = this.program.getOutput(path);
    if (!output?.code) return null;

    // Result
    let result: LoadResult = { code: output.code };
    if (output.codeMap) result.map = JSON.parse(output.codeMap);
    return result;
  }

  public handleStart(context: PluginContext) {
    this.logger.log(
      [
        this.logger.padding,
        apply("awesome-typescript", "underline"),
        ...this.compiler.header,
        ...this.helpers.header,
        ...this.config.header,
        this.logger.padding
      ],
      LoggerLevel.Info
    );
    this.watcher.update();

    context.addWatchFile(trueCase(this.config.path));
    for (let path of this.config.extends) context.addWatchFile(trueCase(path));
  }

  public handleEnd(context: PluginContext) {
    let files: Set<string> = new Set();
    for (let id of context.getModuleIds()) {
      let path = this.resolver.toPath(id);
      if (files.has(path) || !this.filter.includes(path)) continue;
      files.add(path);

      let queue: string[] = [path];
      while (queue.length) {
        let current = queue.pop()!,
          dependencies = this.program.getDependencies(current);
        for (let dependency of dependencies) {
          if (files.has(dependency)) continue;
          queue.push(dependency);
          files.add(dependency);
          context.addWatchFile(trueCase(dependency));
        }
      }
    }

    this.config.check();
    this.program.check(files);
    this.emitter.emit(files);
  }
}
