import type { Options } from "./plugin/types";
import type { Plugin as RollupPlugin, PluginContext } from "rollup";

import { Plugin } from "./plugin";

function awesomeTypescript(options: Options = {}): RollupPlugin {
  let plugin = new Plugin(options);
  return {
    name: "awesome typescript",
    resolveId: plugin.resolve.bind(plugin),
    transform(...args) {
      return plugin.transform(this, ...args);
    },
    moduleParsed: plugin.moduleParsed.bind(plugin)
  };
}

export { awesomeTypescript };
