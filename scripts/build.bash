tsc --incremental --outDir temp --module nodenext
rollup -i src/index.ts -p ./temp/index.js -o lib/index.js -f cjs