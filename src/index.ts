import type { Options } from "./plugin/types";
import type { Plugin as RollupPlugin } from "rollup";

import { Plugin } from "./plugin";
import { WatcherEventKind } from "./plugin/services/watcher";

const EventKindMap = {
  create: WatcherEventKind.Created,
  update: WatcherEventKind.Changed,
  delete: WatcherEventKind.Removed
} as const;

export function awesomeTypescript(options?: Options): RollupPlugin {
  let plugin = new Plugin(options ?? {});
  return {
    name: "awesome typescript",
    watchChange: (id, change) => plugin.watcher.queue(id, EventKindMap[change.event]),
    buildStart: function (options) {
      return plugin.start(this, options);
    },
    resolveId: function (id, origin, { isEntry }) {
      plugin.resolve(this, id, origin, isEntry);
    },
    load: id => plugin.process(id),
    buildEnd: () => plugin.end()
  };
}
