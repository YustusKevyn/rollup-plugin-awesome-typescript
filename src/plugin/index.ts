import type { Options } from "./types";
import type {
  ModuleInfo,
  NormalizedOutputOptions,
  PluginContext,
  TransformResult
} from "rollup";

import { LoggerService } from "./services/logger";
import { CompilerService } from "./services/compiler";
import { ConfigService } from "./services/config";
import { HelpersService } from "./services/helpers";

import { Resolver } from "./core/resolver";
import { Language } from "./core/language";

export class Plugin {
  readonly logger: LoggerService;

  readonly compiler: CompilerService;
  readonly helpers: HelpersService;
  readonly config: ConfigService;

  readonly resolver: Resolver;
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
    this.language = new Language(this);
  }

  watchChange() {}

  resolveId(id: string, origin?: string) {
    if (id === "tslib") return this.helpers.file;
    if (!origin) return null;

    let file = this.resolver.resolve(id, origin)?.resolvedFileName;
    if (!file) return null;

    // this.logger.debug(`Resolved ${this.logger.formatId(id)} to ${file}`);
    // if (resolved.extension === '.d.ts') return null;7

    return file;
  }

  transform(code: string, file: string) {
    this.language.update(file, code);
    this.language.check(file);

    let output = this.language.compile(file);
    if (!output?.code) return null;

    let result: TransformResult = {
      code: output.code,
      map: output.map ? JSON.parse(output.map) : { mappings: "" }
    };
    return result;
  }

  moduleParsed(info: ModuleInfo) {}

  generateBundle(options: NormalizedOutputOptions) {
    // Declarations
    // Build info
  }
}
