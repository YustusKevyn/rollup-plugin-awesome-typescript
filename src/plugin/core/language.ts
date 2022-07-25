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
  diagnostics: Diagnostic[] | null;
}

interface Output {
  declarations?: string;
  source: string;
}

export class Language {
  private scripts: Record<string, Script> = {};

  private host: Host;
  private service: Service;
  private registry: Registry;

  constructor(private plugin: Plugin) {
    this.host = this.createHost();
    this.registry = this.createRegistry();
    this.service = createLanguageService(this.host, this.registry);
  }

  private create(file: string, snapshot: Snapshot) {
    return (this.scripts[file] = {
      version: 0,
      snapshot,
      output: null,
      diagnostics: null
    });
  }

  private add(file: string): Script | null {
    if (!fs.existsSync(file)) return null;
    let source = fs.readFileSync(file, "utf-8");
    return this.create(file, ScriptSnapshot.fromString(source));
  }

  private get(file: string): Script | null {
    return this.scripts[file] ?? null;
  }

  private getVersion(file: string) {
    return (this.get(file) ?? this.add(file))?.version.toString() ?? "";
  }

  private getSnapshot(file: string) {
    return (this.get(file) ?? this.add(file))?.snapshot ?? undefined;
  }

  private getDiagnostics(file: string) {
    let script = this.get(file) ?? this.add(file);
    if (!script) return null;
    if (script.diagnostics) return script.diagnostics;

    return (script.diagnostics = [
      ...this.service.getSemanticDiagnostics(file),
      ...this.service.getSyntacticDiagnostics(file)
    ]);
  }

  update(file: string, source: string) {
    let snapshot = ScriptSnapshot.fromString(source),
      script = this.get(file);
    if (!script) return this.create(file, snapshot);

    script.version++;
    script.snapshot = snapshot;
    script.output = null;
    script.diagnostics = null;
    return script;
  }

  compile(file: string): Output | null {
    let script = this.get(file) ?? this.add(file);
    if (!script) return null;
    if (script.output) return script.output;

    let result = this.service.getEmitOutput(file),
      output: Partial<Output> = {};
    for (let file of result.outputFiles) {
      if (file.name.endsWith(".js")) output.source = file.text;
      else if (file.name.endsWith(".dts")) output.declarations = file.text;
    }
    return output as Output;
  }

  check(file: string) {
    let script = this.get(file) ?? this.add(file);
    if (!file) return null;

    let diagnostics = this.getDiagnostics(file);
    if (!diagnostics) return null;

    this.plugin.logger.diagnostics.print(diagnostics);
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
