import type { Options } from "./plugin/types";
import type { Plugin as RollupPlugin } from "rollup";

import { Plugin } from "./plugin";

export function awesomeTypescript(options?: Options): RollupPlugin {
  let plugin = new Plugin(options ?? {});
  return {
    name: "awesome typescript",
    buildStart: plugin.buildStart.bind(plugin)
  };
}
