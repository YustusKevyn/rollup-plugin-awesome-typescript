const ESC = "\u001b";

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

type Option = Mode | Color | BrightColor | BackgroundColor;

type Mode = keyof typeof modes;
type Color = keyof typeof colors;
type BrightColor = `bright${Capitalize<Color>}`;
type BackgroundColor = `bg${Capitalize<Color>}`;

export function apply(arg: any, ...options: Option[]) {
  for (let option of options) {
    if (option in modes) arg = applyMode(arg, option as Mode);
    else if (option in colors) arg = applyColor(arg, option as Color);
    else if (option.startsWith("bright")) arg = applyBrightColor(arg, option.slice(6).toLowerCase() as Color);
    else if (option.startsWith("bg")) arg = applyBackgroundColor(arg, option.slice(2).toLowerCase() as Color);
  }
  return arg;
}

function applyMode(arg: string, mode: Mode) {
  let code = modes[mode],
    revert = code === 1 ? 22 : code + 20;
  return ESC + "[" + code + "m" + arg + ESC + "[" + revert + "m";
}

function applyColor(arg: string, color: Color) {
  return ESC + "[" + colors[color] + "m" + arg + ESC + "[39m";
}

function applyBrightColor(arg: string, color: Color) {
  return ESC + "[" + (colors[color] + 60) + "m" + arg + ESC + "[39m";
}

function applyBackgroundColor(arg: string, color: Color) {
  return ESC + "[" + (colors[color] + 10) + "m" + arg + ESC + "[49m";
}
