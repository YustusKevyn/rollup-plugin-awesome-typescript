import type { Plugin } from "..";

import { lt } from "semver";
import { exit } from "../util/process";
import { apply } from "../util/ansi";
import { isPath, isRelative } from "../util/path";
import { resolve } from "path";

interface Meta {
  path: string;
  name?: string;
  version?: string;
  supported?: true;
}

export class Helpers {
  readonly meta: Meta;

  constructor(private plugin: Plugin, input: string) {
    this.meta = this.find(input);
  }

  log() {
    let logger = this.plugin.logger,
      message = "Using helper library ";

    if (this.meta.name) {
      message += apply(this.meta.name, "yellow");
      if (this.meta.version) message += " v" + this.meta.version;
    } else message += "at " + logger.formatPath(this.meta.path);

    if (this.meta.supported) logger.info(message);
    else {
      logger.info({
        message,
        description: "Note: This helper library may not be compatible with awesome-typescript"
      });
    }
  }

  private find(input: string): Meta {
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
      config = require(input + "/package.json");
    } catch {
      return { path };
    }

    let { name, version, module } = config;
    if (module) path = require.resolve(input + "/" + module);
    if (name !== "tslib") return { path, name, version };
    if (typeof version !== "string" || lt(version, "2.0.0")) {
      logger.error(
        "This version of tslib is not compatible with awesome-typescript. Please upgrade to the latest release."
      );
      exit();
    }
    return { path, name, version, supported: true };
  }
}
