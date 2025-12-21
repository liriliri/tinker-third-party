#!/usr/bin/env zx

// Enter chili3d directory
cd('chili3d')

// Install dependencies
await $`npm install`

// Build project
await $`npm run build`

// Return to parent directory
cd('..')

// Clean and create dist directory
await $`rm -rf dist`
await $`mkdir -p dist`

// Copy build artifacts to dist directory
await $`cp -r chili3d/dist/* dist/`

console.log(chalk.green('✓ Build completed successfully!'))
