import { RollupOptions } from "rollup";
import { awesomeTypescript } from "./build";

const config: RollupOptions[] = [
  {
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
    plugins: [awesomeTypescript()]
  },
  {
    input: "src/config.ts",
    output: [
      {
        file: "lib/config/index.js",
        format: "cjs"
      },
      {
        file: "lib/config/index.mjs",
        format: "esm"
      }
    ],
    plugins: [awesomeTypescript()]
  }
];
export default config;
