import type { Logger } from "../util/logger";
import type { Compiler } from "../types";

import path from "path";
import { isRelative } from "../util/path";
import { applyColor } from "../util/logger/format";
import { CompilerOptions, ModuleKind } from "typescript";

const acceptedModuleKinds = [ModuleKind.ES2015, ModuleKind.ES2020, ModuleKind.ES2022, ModuleKind.ESNext];

function findConfigFile(file: string, cwd: string, compiler: Compiler, logger: Logger): string {
  // Absolute path
  if(path.isAbsolute(file)){
    if(compiler.sys.fileExists(file)) return file;
    logger.error({message: "Configuration file does not exist.", file});
  }

  // Relative path
  else if(isRelative(file)){
    let resolved = path.resolve(cwd, file);
    if(compiler.sys.fileExists(resolved)) return resolved;
    logger.error({message: `Configuration file does not exists (resolved from ${applyColor(file, "cyan")}).`, file: resolved});
  }

  // Filename
  else {
    while(true){
      let joined = path.join(cwd, file);
      if(compiler.sys.fileExists(joined)) return joined;

      let parent = path.dirname(cwd);
      if(parent === cwd){
        logger.error(`Configuration file with name ${applyColor(file, "cyan")} does not exist in directory tree.`);
        break;
      }
      cwd = parent;
    }
  }

  process.exit();
}

function parseConfigFile(file: string, context: string | undefined, compiler: Compiler, logger: Logger){
  let data = compiler.readConfigFile(file, compiler.sys.readFile);
  if(data.error){
    logger.error({message: "Failed to read configuration file.", file});
    logger.diagnostic(data.error);
    process.exit();
  }
  
  let result = compiler.parseJsonConfigFileContent(
    data.config,
    compiler.sys,
    context ?? path.dirname(file)
  );

  if(result.errors.length){
    logger.error({message: "Failed to parse configuration file.", file});
    logger.diagnostic(result.errors);
    process.exit();
  }
  return result;
}

export function resolveConfig(input: string | undefined, cwd: string, context: string | undefined, compiler: Compiler, logger: Logger){
  let file = findConfigFile(input ?? "tsconfig.json", cwd, compiler, logger);
  logger.info(`Using configuration file ${applyColor(path.relative(cwd, file), "cyan")}`);

  let final = parseConfigFile(file, context, compiler, logger);
  final.options = normalizeOptions(final.options, logger);
  return final;
}

function normalizeOptions(options: CompilerOptions, logger: Logger): CompilerOptions {
  // Module
  if(!options.module) options.module = ModuleKind.ESNext;
  else if(!acceptedModuleKinds.includes(options.module)){
    if(options.module) logger.error(`Module kind "${ModuleKind[options.module]}" is incompatible with rollup. Use one of "ES2015", "ES2020", "ES2022" or "ESNext".`);
    process.exit();
  }

  return {
    ...options,
    noEmit: false,
    noResolve: false,
    noEmitHelpers: true,
    importHelpers: true,
    emitDeclarationOnly: false
  };
}