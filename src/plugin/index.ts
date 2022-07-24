import type { Options } from "./types";
import type { ModuleInfo } from "rollup";

import { LoggerService } from "./services/logger";
import { CompilerService } from "./services/compiler";
import { ConfigService } from "./services/config";
import { HelpersService } from "./services/helpers";

import { Resolver } from "./core/resolver";
import { Linker } from "./core/linker";
import { Scripts } from "./core/scripts";

export class Plugin {
  readonly logger: LoggerService;

  readonly compiler: CompilerService;
  readonly helpers: HelpersService;
  readonly config: ConfigService;

  readonly resolver: Resolver;
  readonly linker: Linker;
  readonly scripts: Scripts;

  readonly cwd: string = process.cwd();
  readonly context?: string;

  constructor(options: Options) {
    if (options.cwd !== undefined) this.cwd = options.cwd;
    if (options.context !== undefined) this.context = options.context;

    let level = options.silent ? -1 : options.logLevel;
    this.logger = new LoggerService(this, level);

    this.compiler = new CompilerService(this, options.compiler);
    this.helpers = new HelpersService(this, options.helpers);
    this.config = new ConfigService(this, options.config);

    this.resolver = new Resolver(this);
    this.linker = new Linker(this);
    this.scripts = new Scripts(this);
  }

  resolveId(id: string, origin?: string) {
    if (id === "tslib") return this.helpers.file;
    if (!origin) return null;

    let resolved = this.resolver.resolve(id, origin)?.resolvedFileName;
    if (!resolved) return null;

    this.logger.debug(
      `Resolved ${this.logger.applyColor(
        "cyan",
        id
      )} imported by ${this.logger.applyColor(
        "yellow",
        origin
      )} to ${this.logger.applyColor("magenta", resolved)}.`
    );

    return resolved;
  }

  transform(code: string, id: string) {
    this.scripts.update(id, code);

    let output = this.scripts.compile(id);
    if (output) return output.source;
  }

  moduleParsed(info: ModuleInfo) {}
}
