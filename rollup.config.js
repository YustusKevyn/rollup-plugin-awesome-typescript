import { awesomeTypescript } from "rollup-plugin-awesome-typescript";
import { version } from "./package.json";
import replace from "@rollup/plugin-replace";

export default {
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
  plugins: [
    awesomeTypescript({
      declarations: "lib/types"
    }),
    replace({
      VERSION: JSON.stringify(version)
    })
  ]
};
