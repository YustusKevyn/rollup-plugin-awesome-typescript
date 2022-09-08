import type { Plugin } from "../plugin";
import type { Message } from "../types";

import { lt } from "semver";
import { dirname, join, resolve } from "path";
import { fileExists } from "../util/fs";
import { apply, Color } from "../util/ansi";
import { isDistinct, isRelative, normalise } from "../util/path";

export class Helpers {
  public path!: string;

  private loaded: boolean = false;
  private message!: Message;

  constructor(private plugin: Plugin) {}

  public init() {
    if (!this.loaded && !this.load()) return false;
    this.plugin.logger.log(this.message);
    return true;
  }

  private load() {
    if (this.loaded) return true;
    let input = this.plugin.options.helpers,
      tracker = this.plugin.tracker;

    // Custom
    if (input) {
      if (typeof input !== "string" || !isDistinct(input)) {
        tracker.recordError({ message: "Custom helper library must be passed as a path." });
        return false;
      }

      if (isRelative(input)) input = resolve(this.plugin.cwd, input);
      if (!fileExists(input)) {
        tracker.recordError({ message: "Could not find the specified helper library.", path: input });
        return false;
      }

      this.path = normalise(input);
      this.message = " • Using custom helper library";
    }

    // Default
    else {
      let path, config;
      try {
        let dir = dirname(require.resolve("tslib"));
        config = require("tslib/package.json");
        path = join(dir, config.module);
      } catch {
        tracker.recordError({ message: "Could not load tslib. Try installing it with `npm i -D tslib`" });
        return false;
      }

      if (lt(config.version, "2.4.0")) {
        tracker.recordError({
          message:
            "This version of tslib is not compatible with Awesome TypeScript. Please upgrade to the latest release."
        });
        return false;
      }

      this.path = path;
      this.message = ` • Using ${apply("tslib", Color.Yellow)} v${config.version}`;
    }

    // Finalise
    this.loaded = true;
    return true;
  }
}
