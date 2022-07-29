import type { Plugin } from "..";

import { lt } from "semver";
import { exit } from "../util/process";
import { apply } from "../util/ansi";
import { isPath, isRelative } from "../util/path";
import { join, resolve } from "path";

export class Helpers {
  readonly path: string;
  readonly supported: boolean = false;

  readonly name?: string;
  readonly version?: string;

  constructor(private plugin: Plugin, input: string) {
    let [path, name, version, supported] = this.find(input);

    this.path = path;
    if (name) this.name = name;
    if (version) this.version = version;
    if (supported) this.supported = true;
  }

  public log() {
    let logger = this.plugin.logger,
      message = "Using helper library ";

    if (this.name) {
      message += apply(this.name, "yellow");
      if (this.version) message += " v" + this.version;
    } else message += "at " + logger.formatPath(this.path);

    if (this.supported) logger.info(message);
    else {
      logger.info({
        message,
        description: "Note: This helper library may not be compatible with awesome-typescript"
      });
    }
  }

  private find(input: string): [path: string, name?: string, version?: string, supported?: boolean] {
    let logger = this.plugin.logger;
    if (isRelative(input)) input = resolve(input, this.plugin.cwd);

    // Path
    let path: string;
    try {
      path = require.resolve(input);
    } catch {
      if (isPath(input)) logger.error({ message: "Could not find the specified helper library.", path: input });
      logger.error({ message: `Could not find the specified helper library ${apply(input, "yellow")}.` });
      exit();
    }

    // Config
    let config;
    try {
      config = require(join(input, "package.json"));
    } catch {
      return [path];
    }

    let { name, version, module } = config;
    if (module) path = require.resolve(join(input, module));
    if (name !== "tslib") return [path, name, version];
    if (typeof version !== "string" || lt(version, "2.4.0")) {
      logger.error(
        "This version of tslib is not compatible with awesome-typescript. Please upgrade to the latest release."
      );
      exit();
    }
    return [path, name, version, true];
  }
}
