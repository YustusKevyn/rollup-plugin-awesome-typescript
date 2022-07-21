import type { Logger } from "../util/logger";
import type { Compiler } from "../types";
import type { ResolverHost } from "./host/types";
import { createModuleResolutionCache } from "typescript";

// import { createModuleResolutionHost, getCanonicalFileName } from "./host/host";
// import { createModuleResolutionCache, nodeModuleNameResolver } from "typescript";

export function createResolver(compiler: Compiler, host: ResolverHost, logger: Logger){
  let cache = createModuleResolutionCache(host.getCurrentDirectory(), host.getCanonicalFileName, host.getCompilationSettings());
}