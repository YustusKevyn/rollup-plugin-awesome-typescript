export interface Record {
  code?: string;
  message: string | string[];
  path?: string;
  position?: Position;
  description?: string | string[];
}

export interface Position {
  line: number;
  character: number;
}
