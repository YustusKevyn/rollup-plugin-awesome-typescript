import type { Compiler } from "../../types";
import type { ParsedCommandLine } from "typescript";
import type { ConfigResolutionHost, ResolverHost } from "./types";

import path from "path";

function getCanonicalFileName(useCaseSensitiveFileNames: boolean){
  return (file: string) => useCaseSensitiveFileNames ? file : file.toLocaleLowerCase();
}

export function createConfigResolutionHost(compiler: Compiler, cwd: string, context?: string): ConfigResolutionHost {
  return {
    fileExists: compiler.sys.fileExists,
    getContextDirectory: file => context ?? path.dirname(file),
    getCurrentDirectory: () => cwd,
    readDirectory: compiler.sys.readDirectory,
    readFile: compiler.sys.readFile,
    useCaseSensitiveFileNames: compiler.sys.useCaseSensitiveFileNames
  };
}
 
export function createResolverHost(compiler: Compiler, config: ParsedCommandLine, cwd: string): ResolverHost {
  return {
    fileExists: compiler.sys.fileExists,
    getCanonicalFileName: getCanonicalFileName(compiler.sys.useCaseSensitiveFileNames),
    getCompilationSettings: () => config.options,
    readFile: compiler.sys.readFile,
    directoryExists: compiler.sys.directoryExists,
    getCurrentDirectory: () => cwd,
    getDirectories: compiler.sys.getDirectories,
    realpath: compiler.sys.realpath,
    useCaseSensitiveFileNames: compiler.sys.useCaseSensitiveFileNames
  };
}