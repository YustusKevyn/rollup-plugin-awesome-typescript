import type { Logger } from "../util/logger";

import fs from "fs";
import path from "path";

import { lt } from "semver";
import { isRelative } from "../util/path";
import { applyColor } from "../util/logger/format";

export function resolveHelpers(input: string | undefined, cwd: string, logger: Logger){
  let file = findHelpers(input, cwd, logger);
  return fs.readFileSync(file, "utf8");
}

function findHelpers(input: string | undefined, cwd: string, logger: Logger){
  // Custom
  if(typeof input === "string" && input !== "tslib"){
    let file: string;

    // Absolute path
    if(path.isAbsolute(input)){
      try {
        let config = require(input+"/package.json");
        file = require.resolve(input+"/"+config.module);
      }
      catch {
        logger.error({message: "Could not load the specified helper library.", file: input});
        process.exit();
      }
      logger.info(`Using helper library at ${applyColor(path.relative(cwd, input), "cyan")}.`);
    }

    // Relative path
    else if(isRelative(input)){
      let resolved = path.resolve(cwd, input);
      try {
        let config = require(resolved+"/package.json");
        file = require.resolve(resolved+"/"+config.module);
      }
      catch {
        logger.error({message: `Could not load the specified helper library (resolved from ${applyColor(input, "cyan")}).`, file: resolved});
        process.exit();
      }
      logger.info(`Using helper library at ${applyColor(input, "cyan")}.`);
    }

    // Package name
    else {
      try {
        let config = require(input+"/package.json");
        file = require.resolve(input+"/"+config.module);
      }
      catch {
        logger.error(`Could not load the specified helper library compiler "${input}".`);
        process.exit();
      }
      logger.info(`Using helper library "${input}"`);
    }

    logger.warn("Your helper library may not be compatible with awesome-typescript.");
    return file;
  }

  // Default
  else {
    let config, file;
    try {
      config = require("tslib/package.json");
      file = require.resolve("tslib/"+config.module);
    }
    catch {
      logger.error("Could not load tslib. Check if it is correctly installed.");
      process.exit();
    }

    // Version
    if(typeof config.version !== "string" || lt(config.version, "2.0.0")){
      logger.error("This version of tslib is not compatible with awesome-typescript. Please upgrade to the latest release.");
      process.exit();
    }

    logger.info(`Using tslib v${config.version}`);
    return file;
  }
}