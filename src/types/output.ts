export interface Build {
  dependencies: Set<string>;
  output: Output;
}

export interface Output {
  js: JsOutput | false;
  declaration: DeclarationOutput | false | null;
}

export interface JsOutput {
  text: string;
  map: string | undefined;
}

export interface DeclarationOutput {
  text: string;
  map: string | undefined;
}
