import { awesomeTypescript } from "rollup-plugin-awesome-typescript";

export default {
  input: "src/index.ts",
  output: [
    {
      file: "lib/index.js",
      format: "cjs",
      exports: "named"
    },
    {
      file: "lib/index.mjs",
      format: "esm"
    }
  ],
  plugins: [
    awesomeTypescript({
      declarations: "lib/types"
    })
  ]
};
