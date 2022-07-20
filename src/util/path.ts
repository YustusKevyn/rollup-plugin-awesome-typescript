const relativePathPattern = /^\.\.?(\/|\\)/;

export function isRelative(path: string){
  return path.match(relativePathPattern);
}