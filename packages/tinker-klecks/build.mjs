#!/usr/bin/env zx

// Enter klecks directory
cd('klecks')

// Install dependencies
await $`npm install`

// Build language files
await $`npm run lang:build`

// Build project
await $`npm run build`

// Return to parent directory
cd('..')

// Clean and create dist directory
await $`rm -rf dist`
await $`mkdir -p dist`

// Copy build artifacts to dist directory
await $`cp -r klecks/dist/* dist/`

// Copy logo (klecks-icon.png) as logo.png
await $`cp klecks/src/app/img/klecks-icon.png dist/logo.png`

console.log(chalk.green('✓ Build completed successfully!'))
