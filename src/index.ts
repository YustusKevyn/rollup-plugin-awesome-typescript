import type { Options } from "./types";

import { Plugin } from "./plugin";

const temp: Options = {
  logLevel: Infinity
}

const awesomeTypescript = (options: Options = {}) => new Plugin(temp);
export default awesomeTypescript;