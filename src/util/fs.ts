import { statSync } from "fs";
import { fileURLToPath } from "url";

export const isCaseSensitive = !fileExists(swapCase(fileURLToPath(import.meta.url)));

export function fileExists(path: string) {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

export function directoryExists(path: string) {
  try {
    return statSync(path).isDirectory();
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
