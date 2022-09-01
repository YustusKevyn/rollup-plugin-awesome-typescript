import { awesomeTypescript } from "rollup-plugin-awesome-typescript";
import { version } from "./package.json";
import replace from "@rollup/plugin-replace";
import dts from "rollup-plugin-dts";

export default [
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
    plugins: [
      awesomeTypescript(),
      replace({
        VERSION: JSON.stringify(version)
      })
    ]
  },
  {
    input: "src/index.ts",
    output: {
      file: "lib/index.d.ts",
      format: "esm"
    },
    plugins: [dts()]
  }
];
