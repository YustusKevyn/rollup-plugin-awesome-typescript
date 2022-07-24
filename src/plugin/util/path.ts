const relativePathPattern = /^\.\.?(\/|\\)/;

export function isRelative(file: string) {
  return file.match(relativePathPattern);
}
