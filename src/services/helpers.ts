import type { Plugin } from "../plugin";

import { lt } from "semver";
import { join, resolve } from "path";
import { apply, Color } from "../util/ansi";
import { isDistinct, isRelative, normalise } from "../util/path";

export class Helpers {
  private loaded: boolean = false;

  public path!: string;
  private package?: {
    name: string;
    version: string;
  };

  constructor(private plugin: Plugin) {}

  public init() {
    if (!this.loaded && !this.load()) return false;
    this.loaded = true;

    let header = [],
      title = " • Using helper library ";
    if (!this.package) title += "at " + this.plugin.logger.formatPath(this.path);
    else title += apply(this.package.name, Color.Yellow) + " v" + this.package.version;
    header.push(title);

    // Supported
    if (this.package?.name !== "tslib")
      header.push(apply("   This helper library may not be compatible with Awesome TypeScript", Color.Grey));

    this.plugin.logger.log(header);
    return true;
  }

  private load() {
    let input = this.plugin.options.helpers ?? "tslib",
      tracker = this.plugin.tracker;
    if (isRelative(input)) input = resolve(this.plugin.cwd, input);

    // Path
    try {
      this.path = normalise(require.resolve(input));
    } catch {
      if (isDistinct(input))
        tracker.recordError({ message: "Could not find the specified helper library.", path: input });
      else tracker.recordError({ message: `Could not find the specified helper library "${input}".` });
      return false;
    }

    // Package
    try {
      this.package = require(join(input, "package.json"));
    } catch {}

    if (this.package?.name === "tslib" && lt(this.package.version, "2.4.0")) {
      tracker.recordError({
        message:
          "This version of tslib is not compatible with Awesome TypeScript. Please upgrade to the latest release."
      });
      return false;
    }

    return true;
  }
}
