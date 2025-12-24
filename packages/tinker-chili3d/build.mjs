#!/usr/bin/env zx

import { cd, $ } from 'zx'
import { existsSync, rmSync, cpSync } from 'fs'
import { join } from 'path'
import { glob } from 'glob'

const __dirname = import.meta.dirname

// Enter chili3d directory
cd(join(__dirname, 'chili3d'))

// Install dependencies
console.log('Installing dependencies...')
await $`npm install`

// Build project
console.log('Building chili3d...')
await $`npm run build`

// Return to parent directory
cd(__dirname)

// Define source and destination paths
const sourceDir = join(__dirname, 'chili3d', 'dist')
const distDir = join(__dirname, 'dist')

// Clean and create dist directory
console.log('Copying build artifacts to dist...')

if (existsSync(distDir)) {
  rmSync(distDir, { recursive: true, force: true })
}

// Copy build artifacts to dist directory
if (existsSync(sourceDir)) {
  cpSync(sourceDir, distDir, { recursive: true })

  // Remove all .map files from dist directory
  console.log('Removing sourcemap files...')
  const mapFiles = await glob('**/*.map', { cwd: distDir, absolute: true })
  mapFiles.forEach((mapFile) => {
    rmSync(mapFile, { force: true })
  })
  console.log(`Removed ${mapFiles.length} sourcemap file(s)`)

  console.log('Build completed successfully!')
} else {
  console.error('Error: Build output directory not found!')
  process.exit(1)
}
