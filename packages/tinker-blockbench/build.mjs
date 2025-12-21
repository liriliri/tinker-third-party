#!/usr/bin/env zx

// Enter blockbench directory
cd('blockbench')

// Install dependencies
await $`npm install`

// Build web version
await $`npm run build-web`

// Return to parent directory
cd('..')

// Clean and create dist directory
await $`rm -rf dist`
await $`mkdir -p dist`

// Copy necessary files to dist directory
// Blockbench web build outputs to the root directory
await $`cp blockbench/index.html dist/`
await $`cp -r blockbench/css dist/`
await $`cp -r blockbench/font dist/`
await $`cp -r blockbench/assets dist/`
await $`cp -r blockbench/dist dist/`
await $`cp blockbench/favicon.png dist/`

console.log(chalk.green('✓ Build completed successfully!'))
