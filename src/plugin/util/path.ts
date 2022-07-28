import { isAbsolute as _isAbsolute, normalize as _normalize } from "path";

export function isPath(path: string) {
  return _isAbsolute(path) || isRelative(path);
}

export function isRelative(path: string) {
  return /^\.\.?($|[\\/])/.test(path);
}

export function normalize(path: string) {
  path = path.replaceAll("\\", "/");
  return _normalize(path);
}
