import "typescript";

declare module "typescript" {
  export function toPath(
    fileName: string,
    basePath: string | undefined,
    getCanonicalFileName: (path: string) => string
  ): Path;

  export interface SourceFile {
    version: string;
  }
}
