import type { Plugin } from "..";
import type {
  Diagnostic,
  DocumentRegistry as Registry,
  IScriptSnapshot as Snapshot,
  LanguageService as Service,
  LanguageServiceHost as Host
} from "typescript";

import fs from "fs";
import {
  createDocumentRegistry,
  createLanguageService,
  ScriptSnapshot
} from "typescript";

interface Script {
  version: number;
  snapshot: Snapshot;
  output: Output | null;
  diagnostics: Diagnostics | null;
}

interface Output {
  declarations?: string;
  source: string;
}

interface Diagnostics {
  syntactic: Diagnostic[];
  semantic: Diagnostic[];
}

export class Scripts {
  private scripts: Record<string, Script> = {};

  private host: Host;
  private service: Service;
  private registry: Registry;

  constructor(private plugin: Plugin) {
    this.host = this.createHost();
    this.registry = this.createRegistry();
    this.service = createLanguageService(this.host, this.registry);
  }

  private create(id: string, snapshot: Snapshot) {
    return (this.scripts[id] = {
      version: 0,
      snapshot,
      output: null,
      diagnostics: null
    });
  }

  private add(id: string): Script | null {
    if (!fs.existsSync(id)) return null;
    let source = fs.readFileSync(id, "utf-8");
    return this.create(id, ScriptSnapshot.fromString(source));
  }

  private get(id: string): Script | null {
    return this.scripts[id] ?? null;
  }

  private getVersion(id: string) {
    return (this.get(id) ?? this.add(id))?.version.toString() ?? "";
  }

  private getSnapshot(id: string) {
    return (this.get(id) ?? this.add(id))?.snapshot ?? undefined;
  }

  private getDiagnostics(id: string): Diagnostics | null {
    let script = this.get(id) ?? this.add(id);
    if (!script) return null;
    if (script.diagnostics) return script.diagnostics;

    return (script.diagnostics = {
      semantic: this.service.getSemanticDiagnostics(id),
      syntactic: this.service.getSyntacticDiagnostics(id)
    });
  }

  update(id: string, source: string) {
    let snapshot = ScriptSnapshot.fromString(source),
      script = this.get(id);
    if (!script) return this.create(id, snapshot);

    script.version++;
    script.snapshot = snapshot;
    script.output = null;
    script.diagnostics = null;
    return script;
  }

  compile(id: string): Output | null {
    let script = this.get(id) ?? this.add(id);
    if (!script) return null;
    if (script.output) return script.output;

    let result = this.service.getEmitOutput(id),
      output: Partial<Output> = {};
    for (let file of result.outputFiles) {
      if (file.name.endsWith(".js")) output.source = file.text;
      else if (file.name.endsWith(".dts")) output.declarations = file.text;
    }
    return output as Output;
  }

  private createHost(): Host {
    let compiler = this.plugin.compiler.instance;
    return {
      fileExists: compiler.sys.fileExists,
      getCompilationSettings: () => this.plugin.config.options,
      getCurrentDirectory: () => this.plugin.cwd,
      getDefaultLibFileName: compiler.getDefaultLibFilePath,
      getScriptFileNames: () => Object.keys(this.scripts),
      getScriptSnapshot: this.getSnapshot.bind(this),
      getScriptVersion: this.getVersion.bind(this),
      readFile: compiler.sys.readFile,
      directoryExists: compiler.sys.directoryExists
    };
  }

  private createRegistry() {
    return createDocumentRegistry(
      this.plugin.compiler.instance.sys.useCaseSensitiveFileNames,
      this.plugin.cwd
    );
  }
}
