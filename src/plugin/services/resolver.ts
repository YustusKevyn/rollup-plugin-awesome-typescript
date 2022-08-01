import type { Plugin } from "..";
import type { ModuleResolutionCache, ModuleResolutionHost } from "typescript";

import { normalizeCase } from "../util/path";

export class Resolver {
  readonly host: ModuleResolutionHost;
  readonly cache: ModuleResolutionCache;

  constructor(private plugin: Plugin) {
    this.host = this.createHost();
    this.cache = this.createCache();
  }

  public toPath(id: string) {
    return this.plugin.compiler.instance.toPath(id, this.plugin.cwd, normalizeCase);
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

  public resolvePath(id: string, origin: string) {
    let result = this.resolve(id, origin);
    return result ? this.toPath(result.resolvedFileName) : null;
  }

  private createHost(): ModuleResolutionHost {
    let sys = this.plugin.compiler.instance.sys;
    return {
      fileExists: sys.fileExists,
      getCurrentDirectory: () => this.plugin.cwd,
      readFile: sys.readFile,
      directoryExists: sys.directoryExists,
      getDirectories: sys.getDirectories,
      useCaseSensitiveFileNames: () => sys.useCaseSensitiveFileNames,
      realpath: sys.realpath
    };
  }

  private createCache() {
    return this.plugin.compiler.instance.createModuleResolutionCache(
      this.plugin.cwd,
      normalizeCase,
      this.plugin.config.options
    );
  }
}
