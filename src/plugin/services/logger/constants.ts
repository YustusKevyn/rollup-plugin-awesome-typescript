export enum Level {
  Error = 0,
  Warn = 1,
  Success = 2,
  Info = 3,
  Debug = 4
}

export const colors = {
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

export const modes = {
  bold: 1,
  dim: 2,
  italic: 3,
  underline: 4,
  inverse: 7,
  hidden: 8,
  strikethrough: 9
} as const;