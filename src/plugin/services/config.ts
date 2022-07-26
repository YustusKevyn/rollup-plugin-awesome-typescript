import type { Plugin } from "..";
import type { CompilerOptions, ParsedCommandLine } from "typescript";

import { dirname } from "path";
import { exit } from "../util/process";

export class Config {
  readonly file: string;
  readonly options: CompilerOptions;

  constructor(private plugin: Plugin, input: string) {
    this.file = this.find(input);
  }

  private find(input: string) {}

  private read(file: string) {
    let logger = this.plugin.logger,
      compiler = this.plugin.compiler.instance,
      data = compiler.readConfigFile(file, compiler.sys.readFile);

    if (data.error) {
      logger.diagnostics.print(data.error);
      exit();
    }
    return data.config;
  }

  private parse(file: string, source: string) {
    let logger = this.plugin.logger,
      compiler = this.plugin.compiler.instance,
      result = compiler.parseJsonConfigFileContent(
        source,
        compiler.sys,
        this.plugin.context ?? dirname(file)
      );

    if (result.errors.length) {
      logger.diagnostics.print(result.errors);
      exit();
    }
    return result;
  }

  private normalize(config: ParsedCommandLine) {}
}
