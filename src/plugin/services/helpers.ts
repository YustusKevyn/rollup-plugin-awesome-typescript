import type { Plugin } from "../plugin";

import { lt } from "semver";
import { join, resolve } from "path";
import { apply } from "../../util/ansi";
import { isDistinct, isRelative, normalise } from "../../util/path";

export class Helpers {
  private state!: {
    path: string;
    name?: string;
    version?: string;
    supported: boolean;
  };

  constructor(private plugin: Plugin) {}

  public get path() {
    return this.state.path;
  }

  public init() {
    if (!this.state && !this.load()) return false;

    let header = [],
      title = " • Using helper library ";
    if (!this.state.name) title += "at " + this.plugin.logger.formatPath(this.state.path);
    else title += apply(this.state.name, "yellow") + (this.state.version ? " v" + this.state.version : "");
    header.push(title);

    if (!this.state.supported)
      header.push(apply("   This helper library may not be compatible with Awesome TypeScript", "grey"));

    this.plugin.logger.log(header);
    return true;
  }

  private load() {
    let input = this.plugin.options.helpers ?? "tslib",
      tracker = this.plugin.tracker;
    if (isRelative(input)) input = resolve(this.plugin.cwd, input);

    // Path
    let path: string;
    try {
      path = normalise(require.resolve(input));
    } catch {
      if (isDistinct(input))
        tracker.recordError({ message: "Could not find the specified helper library.", path: input });
      else tracker.recordError({ message: `Could not find the specified helper library "${input}".` });
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

    if (name === "tslib") {
      if (typeof version !== "string" || lt(version, "2.4.0")) {
        tracker.recordError({
          message:
            "This version of tslib is not compatible with Awesome TypeScript. Please upgrade to the latest release."
        });
        return false;
      }
      supported = true;
    }

    // Save
    this.state = { path, name, version, supported };
    return true;
  }
}
