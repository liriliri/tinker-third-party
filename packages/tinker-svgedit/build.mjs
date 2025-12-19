#!/usr/bin/env zx

// Build svgedit and copy output to dist directory
await cd("svgedit");

// Install dependencies
await $`npm i`;

// Build the project
await $`npm run build`;

// Go back to parent directory
await cd("..");

// Remove existing dist directory if it exists
await $`rm -rf dist`;

// Copy dist/editor to dist
await $`cp -r svgedit/dist/editor dist`;

console.log("Build completed successfully!");
