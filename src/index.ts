import type { Options } from "./types";

import { Plugin } from "./plugin";
import { LogLevel } from "./constants";
import { toRollupPlugin } from "./util/rollup";

function awesomeTypescript(options: Options = {}) {
  return toRollupPlugin(new Plugin(options));
}

export { awesomeTypescript, LogLevel, Options };
export default awesomeTypescript;
