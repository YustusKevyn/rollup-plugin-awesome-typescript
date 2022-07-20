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