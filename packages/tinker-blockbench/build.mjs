#!/usr/bin/env zx

import { cd, $ } from 'zx'
import { existsSync, rmSync, cpSync } from 'fs'
import { join } from 'path'
import { glob } from 'glob'

const __dirname = import.meta.dirname

// Enter blockbench directory
cd(join(__dirname, 'blockbench'))

// Install dependencies
console.log('Installing dependencies...')
await $`npm install`

// Build web version
console.log('Building blockbench web version...')
await $`npm run build-web`

// Return to parent directory
cd(__dirname)

// Define dist directory
const distDir = join(__dirname, 'dist')
const blockbenchDir = join(__dirname, 'blockbench')

// Clean and create dist directory
console.log('Copying build artifacts to dist...')

if (existsSync(distDir)) {
  rmSync(distDir, { recursive: true, force: true })
}

// Copy necessary files to dist directory
// Blockbench web build outputs to the root directory
cpSync(join(blockbenchDir, 'index.html'), join(distDir, 'index.html'))
cpSync(join(blockbenchDir, 'css'), join(distDir, 'css'), { recursive: true })
cpSync(join(blockbenchDir, 'font'), join(distDir, 'font'), { recursive: true })
cpSync(join(blockbenchDir, 'assets'), join(distDir, 'assets'), {
  recursive: true,
})
cpSync(join(blockbenchDir, 'dist'), join(distDir, 'dist'), { recursive: true })
cpSync(join(blockbenchDir, 'favicon.png'), join(distDir, 'favicon.png'))

// Remove all .map files from dist directory
console.log('Removing sourcemap files...')
const mapFiles = await glob('**/*.map', { cwd: distDir, absolute: true })
mapFiles.forEach((mapFile) => {
  rmSync(mapFile, { force: true })
})
console.log(`Removed ${mapFiles.length} sourcemap file(s)`)

console.log('Build completed successfully!')
