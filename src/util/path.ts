import { isCaseSensitive } from "./fs";

import _path from "path";
import { trueCasePathSync } from "true-case-path";

export function isPath(path: string) {
  return isDistinct(path) || /\\|\//.test(path);
}

export function isDistinct(path: string) {
  return _path.isAbsolute(path) || isRelative(path);
}

export function isRelative(path: string) {
  return /^\.\.?($|[\\/])/.test(path);
}

export function isSubPath(path: string, parent: string) {
  if (path.length <= parent.length) return false;
  return path.startsWith(parent) && path[parent.length] === "/";
}

export function normalise(path: string, base?: string) {
  if (base && isRelative(path)) path = _path.relative(base, path);
  path = _path.normalize(path);
  path = normaliseSlashes(path);
  path = normaliseCase(path);
  return path;
}

export function normaliseSlashes(path: string) {
  if (!path.includes("\\")) return path;
  return path.replaceAll("\\", "/");
}

export function normaliseCase(path: string) {
  return isCaseSensitive ? path : path.toLowerCase();
}

const trueCaseCache: Map<string, string> = new Map();

export function trueCase(path: string) {
  if (isCaseSensitive) return path;
  if (!trueCaseCache.has(path)) trueCaseCache.set(path, trueCasePathSync(path));
  return trueCaseCache.get(path)!;
}
