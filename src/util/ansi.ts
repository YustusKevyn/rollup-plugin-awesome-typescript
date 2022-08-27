const ESC = "\u001b";

type StringLike = { toString(): string };

export type Style = Mode | Color | Background;
export type Styles = (Style | undefined)[];

export enum Mode {
  Bold = 1,
  Dim = 2,
  Italic = 3,
  Underline = 4,
  Inverse = 7,
  Hidden = 8,
  Strikethrough = 9
}

export enum Color {
  Black = 30,
  Red = 31,
  Green = 32,
  Yellow = 33,
  Blue = 34,
  Magenta = 35,
  Cyan = 36,
  White = 37,
  Grey = 90,
  BrightRed = 91,
  BrightGreen = 92,
  BrightYellow = 93,
  BrightBlue = 94,
  BrightMagenta = 95,
  BrightCyan = 96,
  BrightWhite = 97
}

export enum Background {
  Black = 40,
  Red = 41,
  Green = 42,
  Yellow = 43,
  Blue = 44,
  Magenta = 45,
  Cyan = 46,
  White = 47,
  Grey = 100
}

export function apply(str: StringLike, ...styles: Styles) {
  for (let style of styles) {
    if (!style) continue;
    str =
      ESC +
      "[" +
      style +
      "m" +
      str +
      ESC +
      "[" +
      (style >= 100 ? 49 : style >= 90 ? 39 : style >= 40 ? 49 : style >= 30 ? 39 : style === 1 ? 22 : style + 20) +
      "m";
  }
  return str as string;
}
