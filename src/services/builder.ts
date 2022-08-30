import type { Build } from "../types";
import type { Plugin } from "../plugin";
import type { PluginContext } from "rollup";

import { endsWith } from "../util/data";
import { trueCase } from "../util/path";
import { forbiddenIdentifiers } from "../constants";

export class Builder {
  private builds: Map<string, Build> = new Map();

  constructor(private plugin: Plugin) {}

  public build(context: PluginContext) {
    for (let path of this.plugin.filter.declarations) context.addWatchFile(trueCase(path));

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

  public getModule(path: string) {
    return this.getBuild(path)?.output.module || null;
  }

  public getDeclaration(path: string) {
    let output = this.getBuild(path)?.output;
    if (!output) return null;

    if (output.declaration === null) {
      let files = this.emit(path, true);
      if (!files) return null;

      if (!files.declaration) output.declaration = false;
      else {
        this.plugin.emitter.declarations.pending.add(path);
        output.declaration = { text: files.declaration, map: files.declarationMap };
      }
    }
    return output.declaration;
  }

  private createBuild(path: string) {
    let source = this.plugin.program.getSource(path);
    if (!source) return null;

    let program = this.plugin.program.instance,
      build: Build = {
        output: { module: false, declaration: false },
        dependencies: new Set()
      };

    // Files
    let files = this.emit(path);
    if (!files) return null;

    // Output
    if (files.js) build.output.module = { text: files.js, map: files.jsMap };
    else if (files.json) build.output.module = { text: this.jsonToModule(files.json) };

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

    // Save
    this.builds.set(path, build);
    return build;
  }

  public invalidateBuild(path: string) {
    this.builds.delete(path);
  }

  public invalidateDeclarations() {
    for (let build of this.builds.values()) build.output.declaration = null;
  }

  private emit(path: string, declarationOnly: boolean = false) {
    let source = this.plugin.program.getSource(path);
    if (!source) {
      this.invalidateBuild(path);
      return null;
    }

    let files: { js?: string; jsMap?: string; declaration?: string; declarationMap?: string; json?: string } = {},
      writeFile = (emitPath: string, emitText: string) => {
        if (endsWith(emitPath, ".js")) files.js = emitText;
        else if (endsWith(emitPath, ".js.map")) files.jsMap = emitText;
        else if (endsWith(emitPath, ".d.ts")) files.declaration = emitText;
        else if (endsWith(emitPath, ".d.ts.map")) files.declarationMap = emitText;
        else if (endsWith(emitPath, ".json")) files.json = emitText;
      };

    this.plugin.program.instance.emit(source, writeFile, undefined, declarationOnly);
    return files;
  }

  private jsonToModule(json: string) {
    let data = JSON.parse(json),
      final = "const data = " + json.slice(0, -1) + ";\n\n";

    if (typeof data === "object" && !Array.isArray(data) && data !== null) {
      for (let key in data) {
        if (!this.plugin.compiler.instance.isIdentifierText(key, this.plugin.config.resolved.target)) continue;
        if (forbiddenIdentifiers.has(key)) continue;
        final += "export const " + key + " = data." + key + ";\n";
      }
    }

    final += "export default data;\n";
    return final;
  }
}
