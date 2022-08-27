import type { EmptyLine } from "../constants";

export * from "./file";
export * from "./options";
export * from "./output";
export * from "./record";

export type Line = string | typeof EmptyLine;
export type Message = Line | Line[];
