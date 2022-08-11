import type { State } from "./types";
import type { Options } from "../types";
import type { LoadResult, PluginContext } from "rollup";

import { Config } from "./services/config";
import { Compiler } from "./services/compiler";
import { Diagnostics } from "./services/diagnostics";
import { Emitter } from "./emitter";
import { Files } from "./services/files";
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
  readonly emitter = new Emitter(this);

  readonly files = new Files(this);
  readonly watcher = new Watcher(this);
  readonly program = new Program(this);

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
      this.emitter.init();
      this.files.init();
      this.program.init();
      this.state = { cycle: 0 };
    }
  }

  public start(context: PluginContext) {
    this.watcher.update();
    for (let path of this.files.configs) context.addWatchFile(trueCase(path));
  }

  public resolve(id: string, origin?: string) {
    if (id === "tslib") return this.helpers.path;
    if (!origin) return null;

    let path = this.resolver.resolvePath(id, origin);
    if (!path || !this.files.isSource(path)) return null;
    return trueCase(path);
  }

  public process(id: string) {
    let path = this.resolver.toPath(id);
    if (!this.files.isSource(path)) return null;

    // Output
    let output = this.program.getBuild(path)?.output;
    if (!output?.code) return null;

    // Result
    let result: LoadResult = { code: output.code };
    if (output.codeMap) result.map = JSON.parse(output.codeMap);
    return result;
  }

  public end(context: PluginContext) {
    for (let path of this.files.declarations) context.addWatchFile(trueCase(path));

    let files: Set<string> = new Set();
    for (let id of context.getModuleIds()) {
      let path = this.resolver.toPath(id);
      if (files.has(path) || !this.files.isSource(path)) continue;
      files.add(path);

      let queue: string[] = [path];
      while (queue.length) {
        let current = queue.pop()!,
          dependencies = this.program.getBuild(current)?.dependencies;
        if (!dependencies) continue;

        for (let dependency of dependencies) {
          if (files.has(dependency) || !this.files.isSource(dependency)) continue;
          files.add(dependency);
          queue.push(dependency);
          context.addWatchFile(trueCase(dependency));
        }
      }
    }

    this.config.check();
    this.emitter.emit(files);
    if (this.options.check !== false) this.program.check(files);
  }
}
