import type { Plugin } from "..";
import type { Diagnostic } from "typescript";

import { concat } from "../../util/data";

export class Checker {
  constructor(private plugin: Plugin) {}

  public check(files: Set<string>) {
    let program = this.plugin.program.instance,
      compiler = this.plugin.compiler.instance,
      syntacticDiagnostics: Readonly<Diagnostic>[] = [],
      semanticDiagnostics: Readonly<Diagnostic>[] = [];

    for (let path of files) {
      let source = this.plugin.program.getSource(path);
      if (!source) continue;

      concat(syntacticDiagnostics, program.getSyntacticDiagnostics(source));
      concat(semanticDiagnostics, program.getSemanticDiagnostics(source));
    }

    let result = { errors: 0, warnings: 0 };
    for (let diagnostic of concat(syntacticDiagnostics, semanticDiagnostics, program.getGlobalDiagnostics())) {
      this.plugin.diagnostics.print(diagnostic);
      if (diagnostic.category === compiler.DiagnosticCategory.Error) result.errors++;
      else if (diagnostic.category === compiler.DiagnosticCategory.Warning) result.warnings++;
    }
    return result;
  }
}
