export interface Properties {
  prefix?: string;
  message: string;
  location?: string;
  position?: Position;
  snippet?: string | string[];
}

export interface Position {
  line: number;
  character: number;
}
