#!/usr/bin/env zx

import { cd, $ } from 'zx'
import { existsSync, rmSync, cpSync } from 'fs'
import { join } from 'path'
import { glob } from 'glob'

const __dirname = import.meta.dirname

// Enter jsoncrack directory
cd(join(__dirname, 'jsoncrack'))

// Install dependencies
console.log('Installing dependencies...')
await $`pnpm i`

// Build project
console.log('Building project...')
await $`npm run build`

// Copy out directory to dist
const outDir = join(__dirname, 'jsoncrack', 'out')
const distDir = join(__dirname, 'dist')

if (existsSync(outDir)) {
  console.log('Copying out directory to dist...')

  // Remove dist directory if it exists
  if (existsSync(distDir)) {
    rmSync(distDir, { recursive: true, force: true })
  }

  cpSync(outDir, distDir, { recursive: true })

  // Remove all .map files from dist directory
  console.log('Removing sourcemap files...')
  const mapFiles = await glob('**/*.map', { cwd: distDir, absolute: true })
  mapFiles.forEach((mapFile) => {
    rmSync(mapFile, { force: true })
  })
  console.log(`Removed ${mapFiles.length} sourcemap file(s)`)

  console.log('Build completed successfully!')
} else {
  console.error('Error: out directory not found!')
  process.exit(1)
}
