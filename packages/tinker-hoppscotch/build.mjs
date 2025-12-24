#!/usr/bin/env zx

import { cd, $ } from 'zx'
import { existsSync, rmSync, cpSync } from 'fs'
import { join } from 'path'

const __dirname = import.meta.dirname

// Enter hoppscotch directory
cd(join(__dirname, 'hoppscotch'))

// Copy .env.example to .env if .env doesn't exist
const envPath = join(__dirname, 'hoppscotch', '.env')
const envExamplePath = join(__dirname, 'hoppscotch', '.env.example')

if (!existsSync(envPath) && existsSync(envExamplePath)) {
  console.log('Creating .env from .env.example...')
  cpSync(envExamplePath, envPath)
}

// Install dependencies
console.log('Installing dependencies...')
await $`pnpm install`

// Build the selfhost-web package
console.log('Building hoppscotch-selfhost-web package...')
await $`pnpm run generate`

// Return to parent directory
cd(__dirname)

// Define source and destination paths
const sourceDir = join(
  __dirname,
  'hoppscotch',
  'packages',
  'hoppscotch-selfhost-web',
  'dist'
)
const distDir = join(__dirname, 'dist')

// Clean and create dist directory
console.log('Copying build artifacts to dist...')

if (existsSync(distDir)) {
  rmSync(distDir, { recursive: true, force: true })
}

if (existsSync(sourceDir)) {
  cpSync(sourceDir, distDir, { recursive: true })
  console.log('Build completed successfully!')
} else {
  console.error('Error: Build output directory not found!')
  process.exit(1)
}
