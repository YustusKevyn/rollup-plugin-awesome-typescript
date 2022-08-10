import type typescript from "typescript";

export interface State {
  path: string;
  name?: string;
  version?: string;
  instance: typeof typescript;
  supported: boolean;
}
