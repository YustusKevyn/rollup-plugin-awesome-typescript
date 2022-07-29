import { statSync } from "fs";

export function existsFile(path: string) {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}
