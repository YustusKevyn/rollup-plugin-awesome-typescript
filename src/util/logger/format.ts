import type { Position, Properties } from "./types";

import path from "path";

const colors = {
  black: 30,
  red: 31,
  green: 32,
  yellow: 33,
  blue: 34,
  magenta: 35,
  cyan: 36,
  white: 37,
  grey: 90
} as const;

const modes = {
  bold: 1,
  dim: 2,
  italic: 3,
  underline: 4,
  inverse: 7,
  hidden: 8,
  strikethrough: 9
} as const;

export function applyColor(str: any, color: keyof typeof colors){
  return `\u001b[${colors[color]}m${str}\u001b[39m`;
}

export function applyMode(str: any, mode: keyof typeof modes){
  let code = modes[mode], revert = code === 1 ? 22 : code+20;
  return `\u001b[${code}m${str}\u001b[${revert}m`;
}

export function formatLocation(file: string, cwd: string, position?: Position){
  let final = "at "+applyColor(path.relative(cwd, file), "cyan");
  if(position) final += +":"+applyColor(position.line, "yellow")+":"+applyColor(position.character, "yellow");
  return final;
}

export function formatBody(props: Properties, cwd: string){
  let final = "";
  if(props.file) final += "\n   "+formatLocation(props.file, cwd, props.position);
  return final;
}