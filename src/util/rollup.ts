import type { Plugin } from "../plugin";
import type { Plugin as RollupPlugin } from "rollup";

/*
 * This allows access to the `this` value of bound functions, which is crucial
 * for a patch that's applied during the `buildEnd` hook.
 */

// @ts-ignore
Function.prototype.__bind = Function.prototype.bind;
Function.prototype.bind = function (...args) {
  // @ts-ignore
  let fn = this.__bind(...args);
  fn.__this = args[0];
  return fn;
};

export function toRollupPlugin(plugin: Plugin): RollupPlugin {
  return {
    name: "Awesome Typescript",
    watchChange(id, change) {
      return plugin.watcher.register(id, change.event);
    },
    options() {
      return plugin.init(this);
    },
    buildStart() {
      return plugin.start(this);
    },
    resolveId(id, origin) {
      return plugin.resolve(id, origin);
    },
    load(id) {
      return plugin.process(id);
    },
    buildEnd() {
      /*
       * This is the only point where the plugin can determine if additional
       * files need to be watched. Rollup, however, doesn't allow
       * `this.addWatchFile` to be called from within the `buildEnd` hook, even
       * though there would be no problems with it whatsoever
       * (https://github.com/rollup/rollup/issues/4599).
       *
       * Until this is implemented by Rollup, a patch is applied that allows
       * the plugin to access the list of watched files. This is done by
       * retrieving the `this` value of a bound function thereby exposing
       * Rollup's internal graph.
       */

      // @ts-ignore
      let graph = this.parse.__this;
      return plugin.end({
        ...this,
        addWatchFile: id => (graph.watchFiles[id] = true)
      });
    }
  };
}
