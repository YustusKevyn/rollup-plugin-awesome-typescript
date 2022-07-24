import type { Plugin } from "..";

import path from "path";
import { lt } from "semver";
import { exit } from "../util/process";
import { isRelative } from "../util/path";

export class HelpersService {
  readonly file: string;

  constructor(private plugin: Plugin, input?: string) {
    this.file = this.find(input ?? "tslib");
  }

  private find(id: string) {
    let logger = this.plugin.logger,
      file: string;

    // Custom
    if (id !== "tslib") {
      // Absolute path
      if (path.isAbsolute(id)) {
        try {
          let config = require(id + "/package.json");
          file = require.resolve(id + "/" + config.module);
        } catch {
          logger.error({
            message: "Could not find the specified helper library.",
            file: id
          });
          exit();
        }
        logger.info(
          `Using helper library at ${logger.applyColor(
            "cyan",
            path.relative(this.plugin.cwd, id)
          )}.`
        );
      }

      // Relative path
      else if (isRelative(id)) {
        let resolved = path.resolve(this.plugin.cwd, id);
        try {
          let config = require(resolved + "/package.json");
          file = require.resolve(resolved + "/" + config.module);
        } catch {
          logger.error({
            message: `Could not find the specified helper library (resolved from ${logger.applyColor(
              "cyan",
              id
            )}).`,
            file: resolved
          });
          exit();
        }
        logger.info(
          `Using helper library at ${logger.applyColor("cyan", id)}.`
        );
      }

      // Package name
      else {
        try {
          let config = require(id + "/package.json");
          file = require.resolve(id + "/" + config.module);
        } catch {
          logger.error(`Could not find the specified helper library "${id}".`);
          exit();
        }
        logger.info(`Using helper library "${id}"`);
      }

      logger.warn(
        "Your helper library may not be compatible with awesome-typescript."
      );
    }

    // Default
    else {
      let config;
      try {
        config = require("tslib/package.json");
        file = require.resolve("tslib/" + config.module);
      } catch {
        logger.error(
          "Could not find tslib. Check if it is correctly installed."
        );
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

    return file;
  }
}
