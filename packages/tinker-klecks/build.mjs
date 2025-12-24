#!/usr/bin/env zx

import { cd, $ } from 'zx'
import { existsSync, rmSync, cpSync } from 'fs'
import { join } from 'path'
import { glob } from 'glob'

const __dirname = import.meta.dirname

// Enter klecks directory
cd(join(__dirname, 'klecks'))

// Install dependencies
console.log('Installing dependencies...')
await $`npm install`

// Build language files
console.log('Building language files...')
await $`npm run lang:build`

// Build project
console.log('Building klecks...')
await $`npm run build`

// Return to parent directory
cd(__dirname)

// Define source and destination paths
const sourceDir = join(__dirname, 'klecks', 'dist')
const distDir = join(__dirname, 'dist')
const logoSourcePath = join(
  __dirname,
  'klecks',
  'src',
  'app',
  'img',
  'klecks-icon.png'
)
const logoDestPath = join(distDir, 'logo.png')

// Clean and create dist directory
console.log('Copying build artifacts to dist...')

if (existsSync(distDir)) {
  rmSync(distDir, { recursive: true, force: true })
}

// Copy build artifacts to dist directory
if (existsSync(sourceDir)) {
  cpSync(sourceDir, distDir, { recursive: true })

  // Copy logo (klecks-icon.png) as logo.png
  if (existsSync(logoSourcePath)) {
    cpSync(logoSourcePath, logoDestPath)
    console.log('Logo copied successfully')
  }

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
