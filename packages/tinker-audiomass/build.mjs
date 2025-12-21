#!/usr/bin/env zx

import { minify as minifyHTML } from 'html-minifier-terser'
import { minify as minifyJS } from 'terser'
import CleanCSS from 'clean-css'
import fse from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sourceDir = path.join(__dirname, 'AudioMass', 'src')
const distDir = path.join(__dirname, 'dist')

// HTML minification options
const htmlMinifyOptions = {
  collapseWhitespace: true,
  removeComments: true,
  removeRedundantAttributes: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
  useShortDoctype: true,
  minifyCSS: true,
  minifyJS: true,
}

// CSS minifier
const cleanCSS = new CleanCSS({
  level: 2,
})

console.log('Build started...\n')

// Step 1: Clean dist directory
console.log('Cleaning dist directory...')
await fse.remove(distDir)
await fse.ensureDir(distDir)

// Step 2: Copy all files from AudioMass/src to dist
console.log('Copying files from AudioMass/src...')
const files = await fse.readdir(sourceDir)

// Files to skip (server files not needed in browser)
const skipFiles = [
  'audiomass-server.go',
  'audiomass-server.py',
  'audiomass.appcache',
  'index-cache.html',
]

for (const file of files) {
  const sourcePath = path.join(sourceDir, file)
  const destPath = path.join(distDir, file)
  const stats = await fse.stat(sourcePath)

  if (skipFiles.includes(file)) {
    console.log(`  ⊘ ${file} (skipped)`)
    continue
  }

  if (stats.isDirectory()) {
    await fse.copy(sourcePath, destPath)
    console.log(`  ✓ ${file}/ (directory)`)
  } else {
    await fse.copy(sourcePath, destPath)
    console.log(`  ✓ ${file}`)
  }
}

// Step 3: Minify HTML files
console.log('\nMinifying HTML files...')
const htmlFiles = ['index.html', 'about.html', 'eq.html', 'sp.html']
for (const htmlFile of htmlFiles) {
  const filePath = path.join(distDir, htmlFile)

  if (await fse.pathExists(filePath)) {
    const htmlContent = await fse.readFile(filePath, 'utf-8')

    try {
      const minified = await minifyHTML(htmlContent, htmlMinifyOptions)
      await fse.writeFile(filePath, minified)

      const originalSize = htmlContent.length
      const minifiedSize = minified.length
      const savings = ((1 - minifiedSize / originalSize) * 100).toFixed(1)
      console.log(`  ✓ ${htmlFile} (reduced ${savings}%)`)
    } catch (error) {
      console.log(`  ⚠ ${htmlFile} (skipped - ${error.message})`)
    }
  }
}

// Step 4: Minify CSS file
console.log('\nMinifying CSS files...')
const cssFile = path.join(distDir, 'main.css')
if (await fse.pathExists(cssFile)) {
  const cssContent = await fse.readFile(cssFile, 'utf-8')

  try {
    const result = cleanCSS.minify(cssContent)

    if (result.errors.length === 0) {
      await fse.writeFile(cssFile, result.styles)
      const originalSize = cssContent.length
      const minifiedSize = result.styles.length
      const savings = ((1 - minifiedSize / originalSize) * 100).toFixed(1)
      console.log(`  ✓ main.css (reduced ${savings}%)`)
    } else {
      console.log(`  ✗ main.css minification failed:`, result.errors)
    }
  } catch (error) {
    console.log(`  ⚠ main.css (skipped - ${error.message})`)
  }
}

// Step 5: Minify JS files (excluding large/compiled files)
console.log('\nMinifying JS files...')
const jsFiles = [
  'actions.js',
  'app.js',
  'contextmenu.js',
  'drag.js',
  'engine.js',
  'fx-auto.js',
  'fx-pg-eq.js',
  'keys.js',
  'local.js',
  'modal.js',
  'oneup.js',
  'recorder.js',
  'state.js',
  'ui-fx.js',
  'ui.js',
  'welcome.js',
  'flac.js',
  'id3.js',
  'lzma.js',
  'sw.js',
  'wav.js',
]

// Skip large compiled/library files like lame.js, libflac.js, rnn_denoise.js

for (const jsFile of jsFiles) {
  const filePath = path.join(distDir, jsFile)

  if (await fse.pathExists(filePath)) {
    const jsContent = await fse.readFile(filePath, 'utf-8')

    try {
      const result = await minifyJS(jsContent, {
        ecma: 2020,
        compress: {
          dead_code: true,
          drop_console: false,
          drop_debugger: true,
        },
        mangle: false,
        format: {
          comments: false,
        },
      })

      if (result.code) {
        await fse.writeFile(filePath, result.code)
        const originalSize = jsContent.length
        const minifiedSize = result.code.length
        const savings = ((1 - minifiedSize / originalSize) * 100).toFixed(1)
        console.log(`  ✓ ${jsFile} (reduced ${savings}%)`)
      }
    } catch (error) {
      console.log(`  ⚠ ${jsFile} (skipped - ${error.message})`)
    }
  }
}

console.log('\nBuild completed!\n')
