import type { Plugin as RollupPlugin } from "rollup";
import type { ParsedCommandLine } from "typescript";
import type { Compiler, Options } from "../types";

import { Logger } from "../util/logger";

import { resolveConfig } from "./config";
import { resolveCompiler } from "./compiler";

console.clear();
console.log("---------------------------");

export class Plugin implements RollupPlugin {
  readonly name = "awesome-typescript";

  private cwd: string = process.cwd();
  private context?: string;
  
  private config: ParsedCommandLine;
  private compiler: Compiler;
  
  private logger: Logger;

  constructor(options: Options){
    if(options.cwd) this.cwd = options.cwd;
    if(options.context) this.context = options.context;

    let level = options.silent === true ? -1 : options.logLevel !== undefined ? options.logLevel : 2;
    this.logger = new Logger(level, this.cwd);

    this.compiler = resolveCompiler(options.compiler, this.logger);
    this.config = resolveConfig(options.config, this.cwd, this.context, this.compiler, this.logger);
  }
}