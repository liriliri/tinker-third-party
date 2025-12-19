#!/usr/bin/env zx

import { cd, $ } from 'zx'
import { existsSync, rmSync, cpSync } from 'fs'
import { join } from 'path'

const __dirname = import.meta.dirname

// Enter Ctool directory
cd(join(__dirname, 'Ctool'))

// Install dependencies
console.log('Installing dependencies...')
await $`pnpm i`

// Build project
console.log('Building project...')
await $`pnpm run build`

// Copy dist directory to parent dist
const sourceDir = join(__dirname, 'Ctool', 'packages', 'ctool-core', 'dist')
const distDir = join(__dirname, 'dist')

if (existsSync(sourceDir)) {
  console.log('Copying dist directory to parent...')

  // Remove dist directory if it exists
  if (existsSync(distDir)) {
    rmSync(distDir, { recursive: true, force: true })
  }

  cpSync(sourceDir, distDir, { recursive: true })
  console.log('Build completed successfully!')
} else {
  console.error('Error: source dist directory not found!')
  process.exit(1)
}
