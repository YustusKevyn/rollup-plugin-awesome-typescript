import type { Plugin } from "..";

import { lt } from "semver";
import { exit } from "../util/process";
import { isRelative } from "../util/path";
import { isAbsolute, resolve } from "path";

export class Helpers {
  readonly location: string;

  constructor(private plugin: Plugin, input: string) {
    this.location = this.find(input);
  }

  private find(input: string) {
    let logger = this.plugin.logger,
      location: string;

    // Custom
    if (input !== "tslib") {
      // Absolute path
      if (isAbsolute(input)) {
        try {
          let config = require(input + "/package.json");
          location = require.resolve(input + "/" + config.module);
        } catch {
          logger.error("Could not find the specified helper library.");
          exit();
        }
        logger.info(`Using helper library at ${logger.formatPath(input)}`);
      }

      // Relative path
      if (isRelative(input)) {
        let resolved = resolve(this.plugin.cwd, input);
        try {
          let config = require(resolved + "/package.json");
          location = require.resolve(resolved + "/" + config.module);
        } catch {
          logger.error("Could not find the specified helper library.");
          exit();
        }
        logger.info(`Using helper library at ${logger.formatPath(resolved)}`);
      }

      // Package name
      else {
        try {
          let config = require(input + "/package.json");
          location = require.resolve(input + "/" + config.module);
        } catch {
          logger.error(`Could not find the specified helper library. Check if "${input}" is installed correctly.`);
          exit();
        }
        logger.info(`Using helper library "${input}"`);
      }

      logger.warn("The specified helper library may not be compatible with awesome-typescript.");
    }

    // Default
    else {
      let config;
      try {
        config = require("tslib/package.json");
        location = require.resolve("tslib/" + config.module);
      } catch {
        logger.error("Could not find tslib. Check if it is correctly installed.");
        exit();
      }

      // Version
      if (typeof config.version !== "string" || lt(config.version, "2.0.0")) {
        logger.error(
          "This version of tslib is not compatible with awesome-typescript. Please upgrade to the latest release."
        );
        exit();
      }

      logger.info(`Using tslib v${config.version}`);
    }

    return location;
  }
}
