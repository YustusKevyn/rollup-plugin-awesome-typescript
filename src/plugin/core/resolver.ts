import type { Plugin } from "..";
import type { ModuleResolutionHost, ModuleResolutionCache } from "typescript";

import {
  createModuleResolutionCache,
  nodeModuleNameResolver
} from "typescript";

export class Resolver {
  private host: ModuleResolutionHost;
  private cache: ModuleResolutionCache;

  constructor(private plugin: Plugin) {
    this.host = this.createHost();
    this.cache = this.createCache();
  }

  resolve(id: string, origin: string) {
    return nodeModuleNameResolver(
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
      useCaseSensitiveFileNames: sys.useCaseSensitiveFileNames
    };
  }

  private createCache() {
    let sys = this.plugin.compiler.instance.sys;
    return createModuleResolutionCache(
      this.plugin.cwd,
      (file) => (sys.useCaseSensitiveFileNames ? file : file.toLowerCase()),
      this.plugin.config.options
    );
  }
}
