import type { Plugin } from "..";
import type typescript from "typescript";

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

export class Compiler {
  readonly meta: Meta;
  readonly instance: typeof typescript;

  constructor(private plugin: Plugin, input: string) {
    this.meta = this.find(input);
    this.instance = require(this.meta.path);
  }

  getCanonicalFileName = (path: string) => (this.instance.sys.useCaseSensitiveFileNames ? path : path.toLowerCase());

  log() {
    let logger = this.plugin.logger,
      message = "Using compiler ";

    if (this.meta.name) {
      message += apply(this.meta.name, "yellow");
      if (this.meta.version) message += " v" + this.meta.version;
    } else message += "at " + logger.formatPath(this.meta.path);

    if (this.meta.supported) logger.info(message);
    else logger.info({ message, description: "Note: This compiler may not be compatible with awesome-typescript" });
  }

  private find(input: string): Meta {
    let logger = this.plugin.logger;
    if (isRelative(input)) input = resolve(input, this.plugin.cwd);

    // Path
    let path: string;
    try {
      path = require.resolve(input);
    } catch {
      if (isPath(input)) logger.error({ message: "Could not find the specified compiler.", path: input });
      logger.error({ message: `Could not find the specified compiler ${apply(input, "yellow")}.` });
      exit();
    }

    // Config
    let config;
    try {
      config = require(input + "/package.json");
    } catch {
      return { path };
    }

    let { name, version } = config;
    if (name !== "typescript") return { path, name, version };
    if (typeof version !== "string" || lt(version, "4.0.0")) {
      logger.error(
        "This version of TypeScript is not compatible with awesome-typescript. Please upgrade to the latest release."
      );
      exit();
    }
    return { path, name, version, supported: true };
  }
}
