import type { Plugin } from "../plugin";
import type { ModuleResolutionCache, ModuleResolutionHost } from "typescript";

import { normaliseCase } from "../util/path";
import { isCaseSensitive } from "../util/fs";

export class Resolver {
  public host!: ModuleResolutionHost;
  public cache!: ModuleResolutionCache;

  constructor(private plugin: Plugin) {}

  public init() {
    (this.host = this.createHost()), (this.cache = this.createCache());
  }

  public update() {
    this.cache.clear();
    this.cache.update(this.plugin.config.store.options);
  }

  public toPath(id: string) {
    return this.plugin.compiler.instance.toPath(id, this.plugin.cwd, normaliseCase);
  }

  public toPaths(ids: string[], filter?: (path: string) => boolean) {
    let final: Set<string> = new Set();
    for (let id of ids) {
      let path = this.toPath(id);
      if (filter && !filter(path)) continue;
      final.add(path);
    }
    return final;
  }

  public resolve(id: string, origin: string) {
    return this.plugin.compiler.instance.resolveModuleName(
      id,
      origin,
      this.plugin.config.store.options,
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
      useCaseSensitiveFileNames: () => isCaseSensitive,
      realpath: sys.realpath
    };
  }

  private createCache() {
    return this.plugin.compiler.instance.createModuleResolutionCache(
      this.plugin.cwd,
      normaliseCase,
      this.plugin.config.store.options
    );
  }
}
