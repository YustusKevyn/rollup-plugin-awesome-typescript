import { awesomeTypescript } from "./build/index";

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
    })
  ]
};
