#!/usr/bin/env zx

import { cd, $ } from 'zx'
import { existsSync, rmSync, cpSync, mkdirSync } from 'fs'
import { join } from 'path'
import { glob } from 'glob'

const __dirname = import.meta.dirname

// Enter miniPaint directory
cd(join(__dirname, 'miniPaint'))

// Install dependencies
console.log('Installing dependencies...')
await $`npm install`

// Build project
console.log('Building miniPaint...')
await $`npm run build`

// Return to parent directory
cd(__dirname)

// Define source and destination paths
const miniPaintDir = join(__dirname, 'miniPaint')
const distDir = join(__dirname, 'dist')
const distDistDir = join(distDir, 'dist')

// Clean and create dist directory
console.log('Copying build artifacts to dist...')

if (existsSync(distDir)) {
  rmSync(distDir, { recursive: true, force: true })
}

mkdirSync(distDistDir, { recursive: true })

// Copy build artifacts to dist/dist directory
const sourceDistDir = join(miniPaintDir, 'dist')
if (existsSync(sourceDistDir)) {
  cpSync(sourceDistDir, distDistDir, { recursive: true })
}

// Copy index.html to dist directory
const indexHtmlPath = join(miniPaintDir, 'index.html')
if (existsSync(indexHtmlPath)) {
  cpSync(indexHtmlPath, join(distDir, 'index.html'))
}

// Copy images directory
const imagesDir = join(miniPaintDir, 'images')
if (existsSync(imagesDir)) {
  cpSync(imagesDir, join(distDir, 'images'), { recursive: true })
}

// Remove all .map files from dist directory
console.log('Removing sourcemap files...')
const mapFiles = await glob('**/*.map', { cwd: distDir, absolute: true })
mapFiles.forEach((mapFile) => {
  rmSync(mapFile, { force: true })
})
console.log(`Removed ${mapFiles.length} sourcemap file(s)`)

console.log('Build completed successfully!')
