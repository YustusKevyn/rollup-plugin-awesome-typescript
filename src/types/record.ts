import type { Message } from ".";
import type { RecordCategory } from "../constants";

export interface Record extends GenericRecord {
  category: RecordCategory;
}

export interface GenericRecord extends RecordChild {
  code?: string;
  children?: RecordChild[];
}

export interface RecordChild {
  message: Message;
  description?: Message;
  snippet?: Message;
  path?: string;
  position?: Position;
}

export interface Position {
  line: number;
  character: number;
}
