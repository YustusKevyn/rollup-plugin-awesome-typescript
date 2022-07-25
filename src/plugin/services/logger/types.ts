import type { backgrounds, colors, modes } from "./constants";

export type Mode = keyof typeof modes;
export type Color = keyof typeof colors;
export type Background = keyof typeof backgrounds;

export interface Properties {
  message: string;
  code?: string;
  id?: string;
  file?: string;
  position?: Position;
  snippet?: string[];
}

export interface Position {
  line: number;
  character: number;
}
