import type { Options } from "./plugin/types";
import type { Plugin as RollupPlugin, PluginContext } from "rollup";

import { Plugin } from "./plugin";

function awesomeTypescript(options: Options = {}): RollupPlugin {
  let plugin = new Plugin(options);
  return {
    name: "awesome typescript",
    resolveId: plugin.resolveId.bind(plugin),
    transform: plugin.transform.bind(plugin),
    moduleParsed: plugin.moduleParsed.bind(plugin)
  };
}

export { awesomeTypescript };
