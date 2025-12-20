#!/usr/bin/env zx

// Enter excalidraw directory
cd('excalidraw')

// Install dependencies
await $`yarn`

// Build project
await $`yarn build`

// Return to parent directory
cd('..')

// Clean and create dist directory
await $`rm -rf dist`
await $`mkdir -p dist`

// Copy build artifacts to dist directory
await $`cp -r excalidraw/excalidraw-app/build/* dist/`

console.log(chalk.green('✓ Build completed successfully!'))
