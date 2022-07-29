import { isAbsolute } from "path";

export function isPath(path: string) {
  return isAbsolute(path) || isRelative(path);
}

export function isRelative(path: string) {
  return /^\.\.?($|[\\/])/.test(path);
}
