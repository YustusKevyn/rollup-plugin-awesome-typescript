import type { Logger } from "../util/logger";
import type { Compiler } from "../types";
import type { CompilerOptions, TsConfigSourceFile } from "typescript";

import path from "path";

const relativePathPattern = /^\.\.?(\/|\\)/;

export function resolveConfig(input: string | undefined, cwd: string, context: string | undefined, compiler: Compiler, logger: Logger){
  let file = findConfigFile(input ?? "tsconfig.json", cwd, compiler, logger);
  return parseConfigFile(file, context, compiler, logger);
}

export function parseConfigFile(file: string, context: string | undefined, compiler: Compiler, logger: Logger){
  let data = compiler.readConfigFile(file, compiler.sys.readFile);
  if(data.error){
    logger.error(`Failed to read configuration file at ${file}`);
    process.exit();
  }
  
  let result = compiler.parseJsonConfigFileContent(
    data.config,
    compiler.sys,
    context ?? path.dirname(file)
  );

  if(result.errors.length){
    logger.error(`Failed to parse configuration file at ${file}`);
    process.exit();
  }
  return result;
}

export function findConfigFile(file: string, cwd: string, compiler: Compiler, logger: Logger): string {
  // Absolute path
  if(path.isAbsolute(file)){
    if(compiler.sys.fileExists(file)) return file;
    logger.error(`Configuration file at ${file} does not exist.`);
  }

  // Relative path
  else if(file.match(relativePathPattern)){
    let resolved = path.resolve(cwd, file);
    if(compiler.sys.fileExists(resolved)) return resolved;
    logger.error(`Configuration file at ${resolved} (resolved from ${file}) does not exist.`);
  }

  // Filename
  else {
    while(true){
      let joined = path.join(cwd, file);
      if(compiler.sys.fileExists(joined)) return joined;

      let parent = path.dirname(cwd);
      if(parent === cwd){
        logger.error(`Configuration file with name ${file} does not exist in directory tree.`);
        break;
      }
      cwd = parent;
    }
  }

  process.exit();
}