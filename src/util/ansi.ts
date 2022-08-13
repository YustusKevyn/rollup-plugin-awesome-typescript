import type { StringLike } from "./types";

const ESC = "\u001b";

const Colors = {
  black: 30,
  red: 31,
  green: 32,
  yellow: 33,
  blue: 34,
  magenta: 35,
  cyan: 36,
  white: 37,
  grey: 90
};

const Modes = {
  bold: 1,
  dim: 2,
  italic: 3,
  underline: 4,
  inverse: 7,
  hidden: 8,
  strikethrough: 9
};

export type Style = Mode | Color | BrightColor | BackgroundColor;
export type Styles = (Style | undefined)[];

export type Mode = keyof typeof Modes;
export type Color = keyof typeof Colors;
export type BrightColor = `bright${Capitalize<Color>}`;
export type BackgroundColor = `bg${Capitalize<Color>}`;

export function apply(str: StringLike, ...styles: Styles) {
  for (let style of styles) {
    if (!style) continue;
    if (style in Modes) str = applyMode(str, style as Mode);
    else if (style in Colors) str = applyColor(str, style as Color);
    else if (style.startsWith("bright")) str = applyBrightColor(str, style.slice(6).toLowerCase() as Color);
    else if (style.startsWith("bg")) str = applyBackgroundColor(str, style.slice(2).toLowerCase() as Color);
  }
  return str as string;
}

export function applyMode(str: StringLike, mode: Mode) {
  let code = Modes[mode],
    revert = code === 1 ? 22 : code + 20;
  return ESC + "[" + code + "m" + str + ESC + "[" + revert + "m";
}

export function applyColor(str: StringLike, color: Color) {
  return ESC + "[" + Colors[color] + "m" + str + ESC + "[39m";
}

export function applyBrightColor(str: StringLike, color: Color) {
  return ESC + "[" + (Colors[color] + 60) + "m" + str + ESC + "[39m";
}

export function applyBackgroundColor(str: StringLike, color: Color) {
  return ESC + "[" + (Colors[color] + 10) + "m" + str + ESC + "[49m";
}
