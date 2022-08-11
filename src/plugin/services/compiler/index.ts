import type { Plugin } from "../..";
import type { State } from "./types";

import { lt } from "semver";
import { join, resolve } from "path";
import { apply } from "../../../util/ansi";
import { isDistinct, isRelative, normalize } from "../../../util/path";

export class Compiler {
  private state!: State;

  constructor(private plugin: Plugin) {}

  public get instance() {
    return this.state.instance;
  }

  public init() {
    if (!this.state && !this.load()) return false;

    let header = [],
      title = " • Using compiler ";
    if (!this.state.name) title += "at " + this.plugin.logger.formatPath(this.state.path);
    else title += apply(this.state.name, "yellow") + (this.state.version ? " v" + this.state.version : "");
    header.push(title);

    if (!this.state.supported)
      header.push(apply("   This compiler may not be compatible with Awesome TypeScript", "grey"));

    this.plugin.logger.log(header);
    return true;
  }

  private load() {
    let input = this.plugin.options.compiler ?? "typescript",
      logger = this.plugin.logger;
    if (isRelative(input)) input = resolve(this.plugin.cwd, input);

    // Path
    let path: string;
    try {
      path = normalize(require.resolve(input));
    } catch {
      if (isDistinct(input)) logger.error({ message: "Could not find the specified compiler.", path: input });
      else logger.error({ message: `Could not find the specified compiler "${input}".` });
      return false;
    }

    // Config
    let name,
      version,
      supported = false;

    try {
      let config = require(join(input, "package.json"));
      name = config.name;
      version = config.version;
    } catch {}

    if (name === "typescript") {
      if (typeof version !== "string" || lt(version, "4.5.0")) {
        logger.error({
          message:
            "This version of TypeScript is not compatible with Awesome TypeScript. Please upgrade to the latest release."
        });
        return false;
      }
      supported = true;
    }

    // Instance
    let instance;
    try {
      instance = require(path);
    } catch {
      if (!name && isDistinct(input)) logger.error({ message: "Could not load the specified compiler.", path: input });
      else logger.error({ message: `Could not load the specified compiler "${name ?? input}".` });
      return false;
    }

    // Save
    this.state = { path, name, version, instance, supported };
    return true;
  }
}
