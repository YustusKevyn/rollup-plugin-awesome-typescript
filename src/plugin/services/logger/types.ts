export interface Properties {
  prefix?: string;
  message: string;
  description?: string | string[];
  path?: string;
  position?: Position;
  snippet?: string | string[];
  indentation?: number;
}

export interface Position {
  line: number;
  character: number;
}
