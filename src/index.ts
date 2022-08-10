import type { Options } from "./types";
import type { Plugin as RollupPlugin } from "rollup";

import { Plugin } from "./plugin";

export function awesomeTypescript(options?: Options): RollupPlugin {
  let plugin = new Plugin(options ?? {});
  return {
    name: "Awesome TypeScript",
    watchChange: (id, change) => plugin.watcher.register(id, change.event),
    options: () => plugin.init(),
    buildStart: function () {
      return plugin.start(this);
    },
    resolveId: (id, origin) => plugin.resolve(id, origin),
    load: id => plugin.process(id),
    buildEnd: function () {
      return plugin.end({
        ...this,
        // @ts-ignore
        addWatchFile: id => (this.parse.__this.watchFiles[id] = true)
      });
    }
  };
}

// @ts-ignore
Function.prototype.__bind = Function.prototype.bind;
Function.prototype.bind = function (...args) {
  // @ts-ignore
  let fn = this.__bind(...args);
  fn.__this = args[0];
  return fn;
};
