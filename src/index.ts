import type { Options } from "./types";

import { Plugin } from "./plugin";

const awesomeTypescript = (options: Options = {}) => new Plugin(options);
export default awesomeTypescript;