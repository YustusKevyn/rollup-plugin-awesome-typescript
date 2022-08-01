import "typescript";

declare module "typescript" {
  export interface SourceFile {
    version: string;
    path: Path;
    resolvedPath: Path;
  }

  export function toPath(
    fileName: string,
    basePath: string | undefined,
    getCanonicalFileName: (path: string) => string
  ): Path;

  export interface TsConfigSourceFile extends JsonSourceFile {
    extendedSourceFiles?: string[];
    configFileSpecs?: ConfigFileSpecs;
  }

  export interface ConfigFileSpecs {
    filesSpecs: readonly string[] | undefined;
    includeSpecs: readonly string[] | undefined;
    excludeSpecs: readonly string[] | undefined;
    validatedFilesSpec: readonly string[] | undefined;
    validatedIncludeSpecs: readonly string[] | undefined;
    validatedExcludeSpecs: readonly string[] | undefined;
    pathPatterns: readonly (string | Pattern)[] | undefined;
    isDefaultIncludeSpec: boolean;
  }

  export interface Pattern {
    prefix: string;
    suffix: string;
  }

  export interface CompilerHost {
    onReleaseOldSourceFile?(oldSourceFile: SourceFile, oldOptions: CompilerOptions, hasSourceFileByPath: boolean): void;
  }

  export function getEmitScriptTarget(compilerOptions: {
    module?: CompilerOptions["module"];
    target?: CompilerOptions["target"];
  }): ScriptTarget;

  export function getFileNamesFromConfigSpecs(
    configFileSpecs: ConfigFileSpecs,
    basePath: string,
    options: CompilerOptions,
    host: ParseConfigHost,
    extraFileExtensions: readonly FileExtensionInfo[]
  ): string[];
}
