import type { Plugin } from "..";
import type { Extension, ModuleResolutionCache, ModuleResolutionHost } from "typescript";

export class Resolver {
  readonly host: ModuleResolutionHost;
  readonly cache: ModuleResolutionCache;

  constructor(private plugin: Plugin) {
    this.host = this.createHost();
    this.cache = this.createCache();
  }

  public resolve(id: string, origin: string) {
    return this.plugin.compiler.instance.nodeModuleNameResolver(
      id,
      origin,
      this.plugin.config.options,
      this.host,
      this.cache
    ).resolvedModule;
  }

  private createHost(): ModuleResolutionHost {
    let sys = this.plugin.compiler.instance.sys;
    return {
      fileExists: sys.fileExists,
      getCurrentDirectory: () => this.plugin.cwd,
      readFile: sys.readFile,
      directoryExists: sys.directoryExists,
      getDirectories: sys.getDirectories,
      useCaseSensitiveFileNames: () => sys.useCaseSensitiveFileNames
    };
  }

  private createCache() {
    return this.plugin.compiler.instance.createModuleResolutionCache(
      this.plugin.cwd,
      this.plugin.compiler.getCanonicalFileName,
      this.plugin.config.options
    );
  }
}
