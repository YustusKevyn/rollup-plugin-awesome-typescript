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

  buildStart() {
    this.compiler.log();
    this.helpers.log();
    this.config.log();
  }

  resolveId(id: string, origin: string) {
    if (id === "tslib") return this.helpers.meta.path;
    if (!origin) return null;

    let path = this.resolver.resolve(id, origin);
    if (!path) return null;

    // this.logger.debug(`Resolved ${this.logger.formatPath(id)} to ${file}`);
    // if (resolved.extension === '.d.ts') return null;

    return path;
  }

  transform(id: string, source: string) {}

  /**
   * WORKFLOW:
   *
   * 1. REMOVE DEAD WATCHED FILES FROM CACHE
   * 2. RESOLVE
   * 3. COMPILE
   * 4. UPDATE GRAPH (RETURN DIFF)
   * 5. TYPECHECK TRANSFORMED FILES AND DEPENDANTS
   * 6. WATCH MISSED FILES
   * 7. EMIT DECLARATIONS
   * 8. REPEAT...
   */
}
