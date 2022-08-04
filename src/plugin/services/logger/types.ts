export interface Record {
  code?: string;
  message: string;
  path?: string;
  position?: Position;
  description?: string | string[];
  snippet?: string | string[];
}

export interface Position {
  line: number;
  character: number;
}
