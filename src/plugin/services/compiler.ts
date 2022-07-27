import type { Plugin } from "..";
import type typescript from "typescript";

import { lt } from "semver";
import { exit } from "../util/process";
import { isRelative } from "../util/path";
import { isAbsolute, resolve } from "path";

export class Compiler {
  readonly location: string;
  readonly instance: typeof typescript;

  constructor(private plugin: Plugin, input: string) {
    this.location = this.find(input);
    this.instance = require(this.location);
  }

  find(input: string) {
    let logger = this.plugin.logger,
      location: string;

    // Custom
    if (input !== "typescript") {
      // Absolute path
      if (isAbsolute(input)) {
        try {
          location = require(input);
        } catch {
          logger.error("Could not find the specified compiler.");
          exit();
        }
        logger.info(`Using compiler at ${logger.formatPath(input)}`);
      }

      // Relative path
      if (isRelative(input)) {
        let resolved = resolve(this.plugin.cwd, input);
        try {
          location = require.resolve(resolved);
        } catch {
          logger.error("Could not find the specified compiler.");
          exit();
        }
        logger.info(`Using compiler at ${logger.formatPath(resolved)}`);
      }

      // Package name
      else {
        try {
          location = require.resolve(input);
        } catch {
          logger.error(`Could not find the specified compiler. Check if "${input}" is installed correctly.`);
          exit();
        }
        logger.info(`Using compiler "${input}"`);
      }

      logger.warn("The specified compiler may not be compatible with awesome-typescript.");
    }

    // Default
    else {
      let config;
      try {
        config = require("typescript/package.json");
        location = require.resolve("typescript");
      } catch {
        logger.error("Could not find TypeScript. Check if it is correctly installed.");
        exit();
      }

      // Version
      if (typeof config.version !== "string" || lt(config.version, "4.0.0")) {
        logger.error(
          "This version of TypeScript is not compatible with awesome-typescript. Please upgrade to the latest release."
        );
        exit();
      }

      logger.info(`Using TypeScript v${config.version}`);
    }

    return location;
  }
}
