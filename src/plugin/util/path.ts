import { isCaseInsensitive } from "./fs";

import _path from "path";
import { trueCasePathSync } from "true-case-path";

export function isPath(path: string) {
  return _path.isAbsolute(path) || isRelative(path) || /\\|\//.test(path);
}

export function isRelative(path: string) {
  return /^\.\.?($|[\\/])/.test(path);
}

export function normalize(path: string, base?: string) {
  if (base && isRelative(path)) path = _path.relative(base, path);
  path = _path.normalize(path);
  path = normalizeSlashes(path);
  path = normalizeCase(path);
  return path;
}

export function normalizeSlashes(path: string) {
  if (!path.includes("\\")) return path;
  return path.replaceAll("\\", "/");
}

export function normalizeCase(path: string) {
  return isCaseInsensitive ? path.toLowerCase() : path;
}

export function trueCase(path: string) {
  return isCaseInsensitive ? trueCasePathSync(path) : path;
}
