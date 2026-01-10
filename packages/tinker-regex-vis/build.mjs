#!/usr/bin/env zx

import { cd, $ } from 'zx'
import { existsSync, rmSync, cpSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const __dirname = import.meta.dirname

// Enter regex-vis directory
cd(join(__dirname, 'regex-vis'))

// Install dependencies
console.log('Installing dependencies...')
await $`pnpm install`

// Build project
console.log('Building regex-vis...')
await $`pnpm run build`

// Return to parent directory
cd(__dirname)

// Define source and destination paths
const sourceDir = join(__dirname, 'regex-vis', 'dist')
const distDir = join(__dirname, 'dist')

// Clean and create dist directory
console.log('Copying build artifacts to dist...')

if (existsSync(distDir)) {
  rmSync(distDir, { recursive: true, force: true })
}

// Copy build artifacts to dist directory
if (existsSync(sourceDir)) {
  cpSync(sourceDir, distDir, { recursive: true })

  // Remove Cloudflare Analytics script from index.html
  console.log('Removing Cloudflare Analytics script...')
  const indexHtmlPath = join(distDir, 'index.html')
  if (existsSync(indexHtmlPath)) {
    let htmlContent = readFileSync(indexHtmlPath, 'utf-8')

    // Remove Cloudflare Web Analytics script block
    htmlContent = htmlContent.replace(
      /<!-- Cloudflare Web Analytics -->[\s\S]*?<!-- End Cloudflare Web Analytics -->/g,
      ''
    )

    // Also remove the script tag if it exists without comments
    htmlContent = htmlContent.replace(
      /<script[^>]*src=['"]https:\/\/static\.cloudflareinsights\.com\/beacon\.min\.js['"][^>]*><\/script>/g,
      ''
    )

    writeFileSync(indexHtmlPath, htmlContent, 'utf-8')
    console.log('Cloudflare Analytics script removed')
  }

  console.log('Build completed successfully!')
} else {
  console.error('Error: Build output directory not found!')
  process.exit(1)
}
