import type { Plugin } from "../plugin";
import type typescript from "typescript";

import { lt } from "semver";
import { join, resolve } from "path";
import { apply, Color } from "../util/ansi";
import { isDistinct, isRelative, normalise } from "../util/path";

export class Compiler {
  private loaded: boolean = false;

  public instance!: typeof typescript;
  private path!: string;
  private package?: {
    name: string;
    version: string;
  };

  constructor(private plugin: Plugin) {}

  public init() {
    if (!this.loaded && !this.load()) return false;
    let message = [];

    // Title
    let title = " • Using compiler ";
    if (!this.package) title += "at " + this.plugin.logger.formatPath(this.path);
    else title += apply(this.package.name, Color.Yellow) + " v" + this.package.version;
    message.push(title);

    // Supported
    if (this.package?.name !== "typescript")
      message.push(apply("   This compiler may not be compatible with Awesome TypeScript", Color.Grey));

    // Finalise
    this.plugin.logger.log(message);
    return true;
  }

  private load() {
    let input = this.plugin.options.compiler ?? "typescript",
      tracker = this.plugin.tracker;
    if (isRelative(input)) input = resolve(this.plugin.cwd, input);

    // Path
    try {
      this.path = normalise(require.resolve(input));
    } catch {
      if (isDistinct(input)) tracker.recordError({ message: "Could not find the specified compiler.", path: input });
      else tracker.recordError({ message: `Could not find the specified compiler "${input}".` });
      return false;
    }

    // Package
    try {
      this.package = require(join(input, "package.json"));
    } catch {}

    if (this.package?.name === "typescript" && lt(this.package.version, "4.5.0")) {
      tracker.recordError({
        message:
          "This version of TypeScript is not compatible with Awesome TypeScript. Please upgrade to the latest release."
      });
      return false;
    }

    // Instance
    try {
      this.instance = require(this.path);
    } catch {
      if (!this.package && isDistinct(input))
        tracker.recordError({ message: "Could not load the specified compiler.", path: input });
      else tracker.recordError({ message: `Could not load the specified compiler "${this.package?.name ?? input}".` });
      return false;
    }

    // Finalise
    this.loaded = true;
    return true;
  }
}
