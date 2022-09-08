import type { Plugin } from "../plugin";
import type { Message } from "../types";
import type typescript from "typescript";

import { lt } from "semver";
import { apply, Color } from "../util/ansi";

export class Compiler {
  public instance!: typeof typescript;

  private loaded: boolean = false;
  private message!: Message;

  constructor(private plugin: Plugin) {}

  public init() {
    if (!this.loaded && !this.load()) return false;
    this.plugin.logger.log(this.message);
    return true;
  }

  private load() {
    let input = this.plugin.options.compiler,
      tracker = this.plugin.tracker;

    // Custom
    if (input) {
      if (typeof input !== "object") {
        tracker.recordError({ message: "Custom compiler must be passed as an instance." });
        return false;
      }

      this.instance = input;
      this.message = " • Using custom compiler";
    }

    // Default
    else {
      let instance, config;
      try {
        instance = require("typescript");
        config = require("typescript/package.json");
      } catch {
        tracker.recordError({ message: "Could not load TypeScript. Try installing it with `npm i -D typescript`" });
        return false;
      }

      if (lt(config.version, "4.5.0")) {
        tracker.recordError({
          message:
            "This version of TypeScript is not compatible with Awesome TypeScript. Please upgrade to the latest release."
        });
        return false;
      }

      this.instance = instance;
      this.message = ` • Using ${apply("TypeScript", Color.Yellow)} v${config.version}`;
    }

    // Finalise
    this.loaded = true;
    return true;
  }
}
