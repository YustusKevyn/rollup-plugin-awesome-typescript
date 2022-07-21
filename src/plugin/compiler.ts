import type { Compiler } from "../types";
import type { Logger } from "../util/logger";

import path from "path";
import { lt } from "semver";
import { exit } from "../util/process";
import { isRelative } from "../util/path";
import { applyColor } from "../util/logger/format";

export function resolveCompiler(input: Compiler | string | undefined, cwd: string, logger: Logger){
  // Package
  if(typeof input === "string" && input !== "typescript"){
    let compiler: Compiler;
    
    // Absolute path
    if(path.isAbsolute(input)){
      try { compiler = require(input); }
      catch {
        logger.error({message: "Could not load the specified TypeScript compiler.", file: input});
        exit();
      }
      logger.info(`Using compiler at ${applyColor(path.relative(cwd, input), "cyan")}.`);
    }

    // Relative path
    else if(isRelative(input)){
      let resolved = path.resolve(cwd, input);
      try { compiler = require(resolved); }
      catch {
        logger.error({message: `Could not load the specified TypeScript compiler (resolved from ${applyColor(input, "cyan")}).`, file: resolved});
        exit();
      }
      logger.info(`Using compiler at ${applyColor(input, "cyan")}.`);
    }

    // Package name
    else {
      try { compiler = require(input); }
      catch {
        logger.error(`Could not load the specified TypeScript compiler "${input}".`);
        exit();
      }
      logger.info(`Using compiler "${input}"`);
    }

    logger.warn("Your TypeScript compiler may not be compatible with awesome-typescript.");
    return compiler;
  }

  // Custom
  else if(typeof input === "object"){
    logger.info("Using custom compiler");
    logger.warn("Your TypeScript compiler may not be compatible with awesome-typescript.");
    return input;
  }

  // Default
  else {
    let compiler: Compiler;
    try { compiler = require("typescript"); }
    catch {
      logger.error("Could not load TypeScript. Check if it is correctly installed.");
      exit();
    }

    // Version
    if(typeof compiler.version !== "string" || lt(compiler.version, "4.0.0")){
      logger.error("This version of TypeScript is not compatible with awesome-typescript. Please upgrade to the latest release.");
      exit();
    }

    logger.info(`Using TypeScript v${compiler.version}`);
    return compiler;
  }
}