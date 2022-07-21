import type { Compiler, Options } from "../types";
import type { ParsedCommandLine } from "typescript";
import type { Plugin as RollupPlugin } from "rollup";

import { Logger } from "../util/logger";

import { resolveConfig } from "./config";
import { resolveCompiler } from "./compiler";
import { resolveHelpers } from "./helpers";

console.clear();
console.log("---------------------------");

export class Plugin implements RollupPlugin {
  readonly name = "awesome-typescript";

  private cwd: string = process.cwd();
  private context?: string;
  
  private config: ParsedCommandLine;
  private helpers: string;
  private compiler: Compiler;
  
  private logger: Logger;

  constructor(options: Options){
    if(options.cwd) this.cwd = options.cwd;
    if(options.context) this.context = options.context;

    let level = options.silent === true ? -1 : options.logLevel !== undefined ? options.logLevel : 2;
    this.logger = new Logger(level, this.cwd);

    this.helpers = resolveHelpers(options.helpers, this.cwd, this.logger);
    this.compiler = resolveCompiler(options.compiler, this.cwd, this.logger);
    this.config = resolveConfig(options.config, this.cwd, this.context, this.compiler, this.logger);
  }

  resolveId(source: string){
    if(source === "tslib") return "\0tslib";
  }

  load(id: string){
    if(id === "\0tslib") return this.helpers;
  }
}