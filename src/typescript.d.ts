import "typescript";

declare module "typescript" {
  export interface SourceFile {
    version: string;
  }
}
