import type { Logger } from "../util/logger";
import type { Compiler } from "../types";
import type { CompilerOptions } from "typescript";
import type { ConfigResolutionHost } from "./host/types";

import path from "path";
import { exit } from "../util/process";
import { isRelative } from "../util/path";
import { applyColor } from "../util/logger/format";
import { ModuleKind } from "typescript";

const acceptedModuleKinds = [ModuleKind.ES2015, ModuleKind.ES2020, ModuleKind.ES2022, ModuleKind.ESNext];

function findConfigFile(file: string, compiler: Compiler, host: ConfigResolutionHost, logger: Logger): string {
  let cwd = host.getCurrentDirectory();

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
  exit();
}

function parseConfigFile(file: string,  compiler: Compiler, host: ConfigResolutionHost, logger: Logger){
  let data = compiler.readConfigFile(file, compiler.sys.readFile);
  if(data.error){
    logger.error({message: "Failed to read configuration file.", file});
    logger.diagnostic(data.error);
    exit();
  }

  let result = compiler.parseJsonConfigFileContent(data.config, host, host.getContextDirectory(file));
  if(result.errors.length){
    logger.error({message: "Failed to parse configuration file.", file});
    logger.diagnostic(result.errors);
    exit();
  }
  return result;
}

export function resolveConfig(input: string | undefined, compiler: Compiler, host: ConfigResolutionHost, logger: Logger){
  let file = findConfigFile(input ?? "tsconfig.json", compiler, host, logger);
  logger.info(`Using configuration at ${applyColor(path.relative(host.getCurrentDirectory(), file), "cyan")}.`);

  let final = parseConfigFile(file, compiler, host, logger);
  final.options = normalizeOptions(final.options, logger);
  return final;
}

function normalizeOptions(options: CompilerOptions, logger: Logger): CompilerOptions {
  // Module
  if(!options.module) options.module = ModuleKind.ESNext;
  else if(!acceptedModuleKinds.includes(options.module)){
    if(options.module) logger.error(`Module kind "${ModuleKind[options.module]}" is incompatible with rollup. Use one of "ES2015", "ES2020", "ES2022" or "ESNext".`);
    exit();
  }

  return {
    ...options,
    noEmit: false,
    noResolve: false,
    importHelpers: true,
    emitDeclarationOnly: false
  };
}