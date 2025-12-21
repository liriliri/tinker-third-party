#!/usr/bin/env zx

// Build Method-Draw and copy output to dist directory
await cd('Method-Draw')

// Install dependencies
await $`npm i`

// Build the project using gulp
await $`npx gulp build`

// Go back to parent directory
await cd('..')

// Remove existing dist directory if it exists
await $`rm -rf dist`

// Copy dist directory
await $`cp -r Method-Draw/dist dist`

console.log('Build completed successfully!')
