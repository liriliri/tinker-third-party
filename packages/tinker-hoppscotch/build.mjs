#!/usr/bin/env zx

import { cd, $ } from 'zx'
import { existsSync, rmSync, cpSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { glob } from 'glob'

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

// Modify main.ts to set extension as default interceptor for web
console.log('Configuring web interceptor to use extension...')
const mainTsPath = join(
  __dirname,
  'hoppscotch',
  'packages',
  'hoppscotch-selfhost-web',
  'src',
  'main.ts'
)

if (existsSync(mainTsPath)) {
  let mainTsContent = readFileSync(mainTsPath, 'utf-8')

  // Change web defaultInterceptor from "browser" to "extension"
  mainTsContent = mainTsContent.replace(
    /web:\s*{[\s\S]*?defaultInterceptor:\s*["']browser["']/,
    (match) =>
      match.replace(
        /defaultInterceptor:\s*["']browser["']/,
        'defaultInterceptor: "extension"'
      )
  )

  writeFileSync(mainTsPath, mainTsContent, 'utf-8')
  console.log('Web interceptor configured to use extension by default')
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
