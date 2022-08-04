const { awesomeTypescript } = require("./temp");

import { terser } from "rollup-plugin-terser";

const config = {
  input: "src/index.ts",
  output: [
    {
      file: "lib/index.js",
      format: "cjs"
    },
    {
      file: "lib/index.mjs",
      format: "esm"
    }
  ],
  plugins: [awesomeTypescript(), terser()]
};
export default config;
