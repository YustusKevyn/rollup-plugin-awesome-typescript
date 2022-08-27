import { Plugin } from "./plugin";
import { LogLevel, PluginMode } from "./constants";
import { toRollupPlugin } from "./util/rollup";

export default function () {
  let plugin = new Plugin({
    logLevel: LogLevel.Error,
    check: true,
    helpers: "tslib",
    compiler: "typescript",
    buildInfo: false,
    declarations: false
  });

  plugin.state.mode = PluginMode.Config;
  return toRollupPlugin(plugin);
}
