export interface Build {
  dependencies: Set<string>;
  output: Output;
}

export interface Output {
  module: ModuleBuild | false;
  declaration: DeclarationOutput | false | null;
}

export interface ModuleBuild {
  text: string;
  map?: string | undefined;
}

export interface DeclarationOutput {
  text: string;
  map?: string | undefined;
}
