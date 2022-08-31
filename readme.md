<h1>
  Awesome TypeScript 🚀<br/>
  <sup><em>for Rollup</em></sup>
</h1>

**Makes development with Rollup and TypeScript awesome!**

- **👁️ Almighty watch mode**  
  Monitors all contributing files, including type-only imports as well as
  declaration and configuration files.
- **🦄 Delightful error messages**  
  Detailed and beautifully formatted error messages display the erroneous code
  as well as its surroundings to provide more context on what went wrong.
- **🏃 Blazing fast rebuilds**  
  Uses a lightweight wrapper around TypeScript's incremental builder to achieve
  nearly the same speed as the TypeScript compiler itself would.
- **🤝 Tight TSConfig integration**  
  Respects the options set in your TSConfig. This includes using the same
  filters (include, exclude and files), automatically resolving path aliases
  and creating declaration files.

<br>

[![npm](https://img.shields.io/npm/v/rollup-plugin-awesome-typescript)](https://npmjs.org/package/rollup-plugin-awesome-typescript)
[![libera manifesto](https://img.shields.io/badge/libera-manifesto-lightgrey.svg)](https://liberamanifesto.com)

---

## Installation

```
npm i -D rollup-plugin-awesome-typescript typescript tslib
```

> Note: Awesome TypeScript requires you to install both `typescript` (≥ 4.5.2)
> and `tslib` (≥ 2.4.0) separately or provide your own compatible
> implementations for them (using the plugin options)

## Usage

Just import and include the plugin in your
[Rollup configuraton file](https://www.rollupjs.org/guide/en/#configuration-files)
and you're good to go.

```typescript
import { awesomeTypescript } from "rollup-plugin-awesome-typescript";

export default {
  plugins: [
    awesomeTypescript({
      // Plugin options go here
    })
  ]
};
```

## Plugin Options

#### _`check`_

Type: `boolean`  
Default: `true`

Specifies whether to enable type checking.

#### _`cwd`_

Type: `string`  
Default: `process.cwd()`

Specifies the current working directory.

#### _`context`_

Type: `string`  
Default: The directory containing the TSConfig

Specifies the base path used to parse the TSConfig. Relative paths within the
TSConfig are resolved with respect to this path.

#### _`config`_

Type: `string` | `false`  
Default: `"tsconfig.json"`

Specifies which TSConfig should be used. Can be one of the following:

- A relative or absolute path
- A filename to search for in the directory tree, starting from the current
  working directory
- `false` to disable the usage of a TSConfig

### _`compilerOptions`_

Type: `CompilerOptions`

Overrides the TSConfig compiler options.

### _`logLevel`_

Type: `LogLevel`  
Default: `LogLevel.Info`

Specifies the log level to which the log output should be restricted. Can
be one of the following:

- `LogLevel.Error`
- `LogLevel.Warn`
- `LogLevel.Info`

#### _`compiler`_

Type: `string`  
Default: `"typescript"`

Specifies the TypeScript compiler to use. Can be one of the following:

- A relative or absolute path pointing to a package or an entry file
- The name of a local dependency

#### _`helpers`_

Type: `string`  
Default: `"tslib"`

Specifies the TypeScript helper library to use. Can be one of the
following:

- A relative or absolute path pointing to a package or an entry file
- The name of a local dependency

#### _`declarations`_

Type: `string` | `boolean`  
Default: TSConfig options

Overrides the TSConfig options that determine if and where to store
incremental compilation information. Can be one of the following:

- A directory name, relative or absolute path to enable the output at the
  specified location
- `true` to enable the output using `"declarationDir"` of the TSConfig as the
  location
- `false` to explicitly disable the output of declaration files

If undefined, the corresponding options in the TSConfig are used as is.

#### _`buildInfo`_

Type: `string` | `boolean`  
Default: TSConfig options

Overrides the TSConfig options that determine if and where to output
declaration files. Can be one of the following:

- A directory name, relative or absolute path to enable the output at the
  specified location
- `true` to enable the output using `"tsBuildInfoFile"` in the TSConfig as the
- location
- `false` to explicitly disable the output of declaration files

## TSConfig Options

While Awesome TypeScript respects your TSConfig options, some of them must be
overridden to work with Rollup, or are ignored because they are managed by
Rollup itself.

Forced options:

- `noEmit` (false):  
  TypeScript must emit code for this plugin to work
- `noResolve` (false):  
  Not resolving modules may brake compilation
- `noEmitHelpers` (false), `importHelpers` (true):  
  The helper library must be included for the final code to work
- `inlineSourceMap` (false):  
  Inline source maps are not supported by Rollup

Ignored options:

- `out`, `outFile`:  
  Bundles are managed by Rollup
