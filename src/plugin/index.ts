import type { Options } from "./types";

import { Logger, LogLevel } from "./services/logger";
import { Compiler } from "./services/compiler";
import { Helpers } from "./services/helpers";
import { Config } from "./services/config";
import { Resolver } from "./services/resolver";
import { Program } from "./services/program";

console.clear();
console.log(new Date().getTime());

export class Plugin {
  readonly cwd: string = process.cwd();
  readonly context?: string;

  readonly logger: Logger;

  readonly compiler: Compiler;
  readonly helpers: Helpers;
  readonly config: Config;
  readonly resolver: Resolver;

  readonly program: Program;

  constructor(options: Options) {
    if (options.cwd) this.cwd = options.cwd;
    if (options.context) this.context = options.context;

    let logLevel = options.silent ? -1 : options.logLevel ?? LogLevel.Info;
    this.logger = new Logger(this, logLevel);

    this.compiler = new Compiler(this, options.compiler ?? "typescript");
    this.helpers = new Helpers(this, options.helpers ?? "tslib");
    this.config = new Config(this, options.config ?? "tsconfig.json");
    this.resolver = new Resolver(this);

    this.program = new Program(this);
  }

  public buildStart() {
    this.compiler.log();
    this.helpers.log();
    this.config.log();
  }

  public resolveId(id: string, origin?: string) {
    if (id === "tslib") return this.helpers.path;
    if (!origin) return null;

    let resolved = this.resolver.resolve(id, origin);
    if (!resolved) return null;

    this.logger.debug(`Resolved ${this.logger.formatPath(id)} to ${resolved.resolvedFileName}`);
    return resolved.resolvedFileName;
  }

  public load(id: string) {}

  public transform(data: string, id: string) {}
}
