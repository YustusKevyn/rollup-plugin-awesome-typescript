import type { Plugin } from "../..";
import type { PluginContext } from "rollup";
import type { Build, EmittedFiles } from "./types";

import { endsWith } from "../../../util/data";
import { trueCase } from "../../../util/path";

export class Builder {
  private builds: Map<string, Build> = new Map();

  constructor(private plugin: Plugin) {}

  public build(context: PluginContext) {
    let files: Set<string> = new Set();
    for (let id of context.getModuleIds()) {
      let path = this.plugin.resolver.toPath(id);
      if (files.has(path) || !this.plugin.filter.isModule(path)) continue;
      files.add(path);

      let queue: string[] = [path];
      while (queue.length) {
        let current = queue.pop()!,
          dependencies = this.getDependencies(current);
        if (!dependencies) continue;
        for (let dependency of dependencies) {
          if (files.has(dependency) || !this.plugin.filter.isModule(dependency)) continue;
          context.addWatchFile(trueCase(dependency));
          files.add(dependency);
          queue.push(dependency);
        }
      }
    }
    return files;
  }

  private getBuild(path: string) {
    return this.builds.get(path) ?? this.createBuild(path);
  }

  public getDependencies(path: string) {
    return this.getBuild(path)?.dependencies ?? null;
  }

  public getJsOutput(path: string) {
    return this.getBuild(path)?.output.js || null;
  }

  public getDeclarationOutput(path: string) {
    return this.getBuild(path)?.output.js || null;
  }

  private createBuild(path: string) {
    let source = this.plugin.program.getSource(path);
    if (!source) return null;

    let program = this.plugin.program.instance,
      build: Build = {
        output: { js: false, declaration: false },
        dependencies: new Set()
      };

    // Output
    let files: EmittedFiles = {},
      result = program.emit(source, (outPath, text) => {
        if (endsWith(outPath, ".js")) files.js = text;
        else if (endsWith(outPath, ".js.map")) files.jsMap = text;
        else if (endsWith(outPath, ".d.ts")) files.declaration = text;
        else if (endsWith(outPath, ".d.ts.map")) files.declarationMap = text;
      });

    if (result.diagnostics) this.plugin.diagnostics.print(result.diagnostics);
    if (files.js) build.output.js = { text: files.js, map: files.jsMap };
    if (files.declaration) {
      this.plugin.emitter.declarations.pending.add(path);
      build.output.declaration = { text: files.declaration, map: files.declarationMap };
    }

    // Dependencies
    let references = program.getState().referencedMap!.getValues(source.resolvedPath);
    if (references) {
      let iterator = references.keys();
      for (let next = iterator.next(); !next.done; next = iterator.next()) build.dependencies.add(next.value);
    }

    return build;
  }

  public invalidateBuild(path: string) {
    this.builds.delete(path);
  }
}
