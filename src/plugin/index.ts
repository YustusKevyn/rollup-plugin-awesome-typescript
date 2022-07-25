import type { Options } from "./types";
import type { ModuleInfo, PluginContext } from "rollup";

import { LoggerService } from "./services/logger";
import { CompilerService } from "./services/compiler";
import { ConfigService } from "./services/config";
import { HelpersService } from "./services/helpers";

import { Resolver } from "./core/resolver";
import { Linker } from "./core/linker";
import { Language } from "./core/language";

export class Plugin {
  readonly logger: LoggerService;

  readonly compiler: CompilerService;
  readonly helpers: HelpersService;
  readonly config: ConfigService;

  readonly resolver: Resolver;
  readonly linker: Linker;
  readonly language: Language;

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
    this.language = new Language(this);
  }

  resolve(id: string, origin?: string) {
    if (id === "tslib") return this.helpers.file;
    if (!origin) return null;

    let file = this.resolver.resolve(id, origin)?.resolvedFileName;
    if (!file) return null;

    this.logger.debug(`Resolved ${this.logger.formatId(id)} to ${file}`);

    return file;
  }

  transform(context: PluginContext, code: string, file: string) {
    this.language.update(file, code);

    let output = this.language.compile(file);

    this.language.check(file);
    if (output) return output.source;
  }

  moduleParsed(info: ModuleInfo) {}
}
