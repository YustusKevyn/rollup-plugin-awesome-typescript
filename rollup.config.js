import { awesomeTypescript } from "./build";

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
  plugins: [awesomeTypescript()]
};
export default config;
