import type { Plugin } from "..";
import type typescript from "typescript";

import { lt } from "semver";
import { exit } from "../util/process";
import { apply } from "../util/ansi";
import { isPath, isRelative } from "../util/path";
import { join, resolve } from "path";

export class Compiler {
  readonly instance: typeof typescript;

  private path: string;
  private name?: string;
  private version?: string;
  private supported: boolean = false;

  constructor(private plugin: Plugin, input: string) {
    let [path, name, version, supported] = this.find(input);

    this.path = path;
    this.instance = require(path);
    if (name) this.name = name;
    if (version) this.version = version;
    if (supported) this.supported = true;
  }

  public get header() {
    let final = [];

    let title = " • Using compiler ";
    if (!this.name) title += "at " + this.plugin.logger.formatPath(this.path);
    else title += apply(this.name, "yellow") + (this.version ? " v" + this.version : "");
    final.push(title);

    if (!this.supported) final.push(apply("   This compiler may not be compatible with awesome-typescript", "grey"));

    return final;
  }

  private find(input: string): [path: string, name?: string, version?: string, supported?: boolean] {
    let logger = this.plugin.logger;
    if (isRelative(input)) input = resolve(input, this.plugin.cwd);

    // Path
    let path: string;
    try {
      path = require.resolve(input);
    } catch {
      if (isPath(input)) logger.error({ message: "Could not find the specified compiler.", path: input });
      logger.error({ message: `Could not find the specified compiler "${input}".` });
      exit();
    }

    // Config
    let config;
    try {
      config = require(join(input, "package.json"));
    } catch {
      return [path];
    }

    let { name, version } = config;
    if (name !== "typescript") return [path, name, version];
    if (typeof version !== "string" || lt(version, "4.7.0")) {
      logger.error(
        "This version of TypeScript is not compatible with awesome-typescript. Please upgrade to the latest release."
      );
      exit();
    }
    return [path, name, version, true];
  }
}
