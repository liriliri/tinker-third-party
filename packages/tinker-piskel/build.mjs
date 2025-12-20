#!/usr/bin/env zx

// Enter piskel directory
cd('piskel')

// Install dependencies
await $`npm install`

// Build project
await $`grunt build`

// Return to parent directory
cd('..')

// Clean and create dist directory
await $`rm -rf dist`
await $`mkdir -p dist`

// Copy build artifacts to dist directory
await $`cp -r piskel/dest/prod/* dist/`

console.log(chalk.green('✓ Build completed successfully!'))
