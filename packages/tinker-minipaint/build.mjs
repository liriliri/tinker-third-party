#!/usr/bin/env zx

// Enter miniPaint directory
cd('miniPaint')

// Install dependencies
await $`npm install`

// Build project
await $`npm run build`

// Return to parent directory
cd('..')

// Clean and create dist directory
await $`rm -rf dist`
await $`mkdir -p dist/dist`

// Copy build artifacts to dist/dist directory
await $`cp -r miniPaint/dist/* dist/dist/`

// Copy index.html to dist directory
await $`cp miniPaint/index.html dist/`

// Copy images directory
await $`cp -r miniPaint/images dist/`

console.log(chalk.green('✓ Build completed successfully!'))
