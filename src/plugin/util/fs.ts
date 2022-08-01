import { statSync } from "fs";

export const isCaseInsensitive = fileExists(swapCase(__filename));

export function fileExists(path: string) {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

function swapCase(str: string) {
  return str.replace(/w/g, char => {
    let upper = char.toUpperCase();
    return char === upper ? char.toLowerCase() : upper;
  });
}
