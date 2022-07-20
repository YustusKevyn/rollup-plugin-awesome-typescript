import type { Compiler } from "../types";
import type { Logger } from "../util/logger";

import { lt } from "semver";

export function resolveCompiler(input: Compiler | string | undefined, logger: Logger): Compiler {
  // Package
  if(typeof input === "string" && input !== "typescript"){
    let compiler: Compiler;
    try { compiler = require(input); }
    catch {
      logger.error(`Could not find the specified TypeScript compiler ("${input}"). Check if it correctly installed.`);
      process.exit();
    }

    logger.info(`Using "${input}"`);
    logger.warn("Your TypeScript compiler may not be compatible with awesome-typescript.");
    return compiler;
  }

  // Custom
  else if(typeof input === "object"){
    logger.warn("Your TypeScript compiler may not be compatible with awesome-typescript.");
    return input;
  }

  // Default
  else {
    let compiler: Compiler;
    try { compiler = require("typescript"); }
    catch {
      logger.error("Could not find TypeScript. Check if it is correctly installed.");
      process.exit();
    }

    // Version
    if(typeof compiler.version !== "string" || lt(compiler.version, "4.0.0")){
      logger.error("This version of TypeScript is not compatible with awesome-typescript. Please upgrade to the latest release.");
      process.exit();
    }

    logger.info(`Using TypeScript v${compiler!.version}`);
    return compiler;
  }
}