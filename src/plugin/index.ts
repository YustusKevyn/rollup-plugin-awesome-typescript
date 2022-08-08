import type { Options } from "../types";
import type { LoadResult, PluginContext } from "rollup";

import { Config } from "./services/config";
import { Compiler } from "./services/compiler";
import { Emitter } from "./services/emitter";
import { Filter } from "./services/filter";
import { Helpers } from "./services/helpers";
import { Logger, LoggerLevel } from "./services/logger";
import { Program } from "./services/program";
import { Resolver } from "./services/resolver";
import { Watcher } from "./services/watcher";

import { apply } from "../util/ansi";
import { trueCase, normalize } from "../util/path";

export class Plugin {
  readonly cwd: string = normalize(process.cwd());
  readonly context?: string;

  readonly logger: Logger;

  readonly compiler: Compiler;
  readonly helpers: Helpers;
  readonly config: Config;

  readonly resolver: Resolver;
  readonly filter: Filter;
  readonly watcher: Watcher;

  readonly program: Program;
  readonly emitter: Emitter;

  constructor(readonly options: Options) {
    if (options.cwd) this.cwd = normalize(options.cwd, this.cwd);
    if (options.context) this.context = normalize(options.context, this.cwd);

    this.logger = new Logger(this, LoggerLevel.Info);

    this.compiler = new Compiler(this);
    this.helpers = new Helpers(this);
    this.config = new Config(this);

    this.resolver = new Resolver(this);
    this.filter = new Filter(this);
    this.watcher = new Watcher(this);

    this.program = new Program(this);
    this.emitter = new Emitter(this);
  }

  public resolve(id: string, origin?: string) {
    if (id === "tslib") return this.helpers.path;
    if (!origin) return null;

    let path = this.resolver.resolvePath(id, origin);
    if (!path || !this.filter.files.has(path)) return null;
    return trueCase(path);
  }

  public process(id: string) {
    let path = this.resolver.toPath(id);
    if (!this.filter.files.has(path)) return null;

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
        apply("Awesome TypeScript", "underline"),
        ...this.compiler.header,
        ...this.helpers.header,
        ...this.config.header,
        this.logger.padding
      ],
      LoggerLevel.Info
    );
    this.watcher.update();

    for (let path of this.filter.configs) context.addWatchFile(trueCase(path));
  }

  public handleEnd(context: PluginContext) {
    let files: Set<string> = new Set();
    for (let id of context.getModuleIds()) {
      let path = this.resolver.toPath(id);
      if (files.has(path) || !this.filter.files.has(path)) continue;
      files.add(path);

      let queue: string[] = [path];
      while (queue.length) {
        let current = queue.pop()!,
          dependencies = this.program.getDependencies(current);
        if (!dependencies) continue;

        for (let dependency of dependencies) {
          if (files.has(dependency) || !this.filter.files.has(path)) continue;
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
