import type { Plugin } from "../plugin";
import type { Diagnostic } from "typescript";

import { concat } from "../../util/data";

export class Checker {
  constructor(private plugin: Plugin) {}

  public check(files: Set<string>) {
    let program = this.plugin.program.instance,
      syntacticDiagnostics: Readonly<Diagnostic>[] = [],
      semanticDiagnostics: Readonly<Diagnostic>[] = [];

    for (let path of files) {
      let source = this.plugin.program.getSource(path);
      if (!source) continue;

      concat(syntacticDiagnostics, program.getSyntacticDiagnostics(source));
      concat(semanticDiagnostics, program.getSemanticDiagnostics(source));
    }

    this.plugin.diagnostics.record(syntacticDiagnostics);
    this.plugin.diagnostics.record(semanticDiagnostics);
    this.plugin.diagnostics.record(program.getGlobalDiagnostics());
  }
}
