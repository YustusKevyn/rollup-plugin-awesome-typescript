import fs from "fs";

export function fileExists(path: string){
  try { return fs.statSync(path).isFile(); }
  catch { return false; }
}

export function directoryExists(path: string){
  try { return fs.statSync(path).isDirectory(); }
  catch { return false; }
}