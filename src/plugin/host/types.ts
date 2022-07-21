import type { CompilerOptions, ModuleResolutionHost, ParseConfigHost } from "typescript"

export interface ConfigResolutionHost extends ParseConfigHost {
  getCurrentDirectory(): string;
  getContextDirectory(file: string): string;
}

export interface ResolverHost extends ModuleResolutionHost {
  getCurrentDirectory(): string;
  getCanonicalFileName(file: string): string;
  getCompilationSettings(): CompilerOptions;
}