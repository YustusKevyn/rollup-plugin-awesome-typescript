const relativePathPattern = /^\.\.?(\/|\\)/;

import path from "path";

export function isRelative(file: string){
  return file.match(relativePathPattern);
}

export function normalize(file: string){
  return file.replaceAll(path.win32.sep, path.posix.sep);
}