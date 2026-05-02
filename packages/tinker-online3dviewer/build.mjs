#!/usr/bin/env zx

import { cd, $ } from 'zx'
import { existsSync, rmSync, cpSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { glob } from 'glob'

const __dirname = import.meta.dirname

// Enter Online3DViewer directory
cd(join(__dirname, 'Online3DViewer'))

// Install dependencies
console.log('Installing dependencies...')
await $`npm install`

// Build website
console.log('Building Online3DViewer website...')
await $`npm run build_engine`
await $`npm run build_website`

// Return to parent directory
cd(__dirname)

// Define paths
const projectDir = join(__dirname, 'Online3DViewer')
const distDir = join(__dirname, 'dist')

// Clean dist directory
console.log('Copying build artifacts to dist...')

if (existsSync(distDir)) {
  rmSync(distDir, { recursive: true, force: true })
}

// Copy website static files (HTML, assets, etc.)
cpSync(join(projectDir, 'website'), distDir, { recursive: true })

// Copy built website bundle to o3dv/ subdirectory (matching official package structure)
cpSync(join(projectDir, 'build', 'website'), join(distDir, 'o3dv'), { recursive: true })

// Copy engine build
const engineDir = join(projectDir, 'build', 'engine')
if (existsSync(engineDir)) {
  cpSync(
    join(engineDir, 'o3dv.min.js'),
    join(distDir, 'o3dv.min.js')
  )
}

// Fix references in HTML files and remove cookie consent
const htmlFiles = ['index.html', 'embed.html']
for (const htmlFile of htmlFiles) {
  const filePath = join(distDir, htmlFile)
  if (existsSync(filePath)) {
    let content = readFileSync(filePath, 'utf-8')
    content = content.replace(/\.\.\/build\/website_dev\//g, 'o3dv/')
    content = content.replace(/\.\.\/build\/website\//g, 'o3dv/')
    // Hide cookie consent banner
    content = content.replace('</head>', '<style>.ov_bottom_floating_panel{display:none!important;}</style>\n</head>')
    writeFileSync(filePath, content)
  }
}

// Remove all .map files from dist directory
console.log('Removing sourcemap files...')
const mapFiles = await glob('**/*.map', { cwd: distDir, absolute: true })
mapFiles.forEach((mapFile) => {
  rmSync(mapFile, { force: true })
})
console.log(`Removed ${mapFiles.length} sourcemap file(s)`)

console.log('Build completed successfully!')
