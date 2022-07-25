import type typescript from "typescript";
import type { Plugin } from "..";

import path from "path";
import { lt } from "semver";
import { exit } from "../util/process";
import { isRelative } from "../util/path";

export class CompilerService {
  readonly file: string;
  readonly instance: typeof typescript;

  constructor(private plugin: Plugin, input?: string) {
    this.file = this.find(input ?? "typescript");
    this.instance = require(this.file);
  }

  private find(id: string) {
    let logger = this.plugin.logger,
      file: string;

    // Custom
    if (id !== "typescript") {
      // Absolute path
      if (path.isAbsolute(id)) {
        try {
          file = require.resolve(id);
        } catch {
          logger.error({
            message: "Could not find the specified TypeScript compiler.",
            id
          });
          exit();
        }
        logger.info(`Using compiler at ${logger.formatId(id)}.`);
      }

      // Relative path
      else if (isRelative(id)) {
        let resolved = path.resolve(this.plugin.cwd, id);
        try {
          file = require.resolve(resolved);
        } catch {
          logger.error({
            message: "Could not find the specified TypeScript compiler.",
            id: resolved
          });
          exit();
        }
        logger.info(`Using compiler at ${logger.formatId(resolved)}.`);
      }

      // Package name
      else {
        try {
          file = require(id);
        } catch {
          logger.error(
            `Could not find the specified TypeScript compiler "${id}".`
          );
          exit();
        }
        logger.info(`Using compiler "${id}"`);
      }

      logger.warn(
        "Your TypeScript compiler may not be compatible with awesome-typescript."
      );
      return file;
    }

    // Default
    else {
      let config;
      try {
        config = require("typescript/package.json");
        file = require.resolve("typescript");
      } catch {
        logger.error(
          "Could not find TypeScript. Check if it is correctly installed."
        );
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

    return file;
  }
}
