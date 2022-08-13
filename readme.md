<h1>
  Awesome TypeScript 🚀<br/>
  <sup><em>for Rollup</em></sup>
</h1>

Make TypeScript development using Rollup fun again!

<img align="right" src="./screenshot.png" width="400">

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

<dl>
  <dt><h4><code>check</code></h4></dt>
  <dd>
    <p>Type: <code>boolean</code><br/>Default: <code>true</code></p>
    <p>Specifies whether to enable type checking.</p>
  </dd>

  <dt><h4><code>cwd</code></h4></dt>
  <dd>
    <p>Type: <code>string</code><br/>Default: <code>process.cwd()</code></p>
    <p>Specifies the current working directory.</p>
  </dd>

  <dt><h4><code>context</code></h4></dt>
  <dd>
    <p>Type: <code>string</code><br/>Default: The directory containing the TSConfig</p>
    <p>Specifies the base path used to parse the TSConfig. Relative paths 
    within the configuration are resolved with respect to this path.</p>
  </dd>

  <dt><h4><code>config</code></h4></dt>
  <dd>
    <p>Type: <code>string</code><br/>Default: <code>"tsconfig.json"</code></p>
    <p>
      Specifies the location of the TSConfig. Can be one of the following:
      <ul>
        <li>A relative or absolute path</li>
        <li>A filename to search for in the directory tree, starting from the 
        current working directory</li>
      </ul>
    </p>
  </dd>

  <dt><h4><code>compiler</code></h4></dt>
  <dd>
    <p>Type: <code>string</code><br/>Default: <code>"typescript"</code></p>
    <p>
      Specifies the TypeScript compiler to use. Can be one of the following:
      <ul>
        <li>A relative or absolute path pointing to a package or an entry file</li>
        <li>The name of a local dependency</li>
      </ul>
    </p>
  </dd>

  <dt><h4><code>helpers</code></h4></dt>
  <dd>
    <p>Type: <code>string</code><br/>Default: <code>"tslib"</code></p>
    <p>
      Specifies the TypeScript helper library to use. Can be one of the following:
      <ul>
        <li>A relative or absolute path pointing to a package or an entry file</li>
        <li>The name of a local dependency</li>
      </ul>
    </p>
  </dd>

  <dt><h4><code>declarations</code></h4></dt>
  <dd>
    <p>Type: <code>string</code> | <code>boolean</code></p>
    <p>
      Overwrites the TSConfig options that determine if and where to output 
      declaration files. Can be one of the following:
      <ul>
        <li>A directory name, relative or absolute path to enable the output at 
        the specified location</li>
        <li><code>true</code> to enable the output using <code>"declarationDir"</code> 
        of the TSConfig as the location</li>
        <li><code>false</code> to explicitly disable the output of declaration 
        files</li>
      </ul>
      If undefined, the corresponding options in the TSConfig are used as is.
    </p>
  </dd>

  <dt><h4><code>buildInfo</code></h4></dt>
  <dd>
    <p>Type: <code>string</code> | <code>boolean</code></p>
    <p>
      Overwrites the TSConfig options that determine if and where to store 
      incremental compilation information. Can be one of the following:
      <ul>
        <li>A directory name, relative or absolute path to enable the output at 
        the specified location</li>
        <li><code>true</code> to enable the output using <code>"tsBuildInfoFile"</code> 
        of the TSConfig as the location</li>
        <li><code>false</code> to explicitly disable the output of incremental 
        compilation information</li>
      </ul>
      If undefined, the corresponding options in the TSConfig are used as is.
    </p>
  </dd>
</dl>

## TSConfig Options

While Awesome TypeScript respects your TSConfig options, some of them must be
overwriten to work with Rollup, or are ignored because they are managed by
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
