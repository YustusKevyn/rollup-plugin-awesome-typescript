import type { colors, modes } from "./constants";

export type Mode = keyof typeof modes;
export type Color = keyof typeof colors;

export interface Properties {
  message: string;
  code?: string;
  file?: string;
  position?: Position;
}

export interface Position {
  line: number;
  character: number;
}