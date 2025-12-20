#!/usr/bin/env zx

import { minify as minifyHTML } from 'html-minifier-terser'
import { minify as minifyJS } from 'terser'
import CleanCSS from 'clean-css'
import fse from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sourceDir = path.join(__dirname, 'drawio/src/main/webapp')
const distDir = path.join(__dirname, 'dist')

// Resources to copy without processing
const resourcesToCopy = [
  'images',
  'img',
  'plugins',
  'resources',
  'templates',
  'mxgraph',
  'math4',
  'META-INF',
  'WEB-INF',
  'connect',
  'favicon.ico',
  'export-fonts.css',
  'shortcuts.svg',
  'monday-app-association.json',
  'service-worker.js',
  'service-worker.js.map',
  'workbox-05b6c01b.js',
  'workbox-05b6c01b.js.map',
  'workbox-acfd85e3.js',
  'workbox-acfd85e3.js.map',
]

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

// Step 2: Copy resources
console.log('Copying resources...')
for (const resource of resourcesToCopy) {
  const sourcePath = path.join(sourceDir, resource)
  const destPath = path.join(distDir, resource)

  if (await fse.pathExists(sourcePath)) {
    await fse.copy(sourcePath, destPath)
    console.log(`  ✓ ${resource}`)
  } else {
    console.log(`  ⚠ ${resource} not found, skipped`)
  }
}

// Step 3: Minify HTML files
console.log('\nMinifying HTML files...')
const htmlFiles = [
  'index.html',
  'clear.html',
  'dropbox.html',
  'export3.html',
  'github.html',
  'gitlab.html',
  'onedrive3.html',
  'open.html',
  'teams.html',
  'vsdxImporter.html',
]

for (const htmlFile of htmlFiles) {
  const sourcePath = path.join(sourceDir, htmlFile)
  const destPath = path.join(distDir, htmlFile)

  if (await fse.pathExists(sourcePath)) {
    const htmlContent = await fse.readFile(sourcePath, 'utf-8')
    const minified = await minifyHTML(htmlContent, htmlMinifyOptions)
    await fse.writeFile(destPath, minified)

    const originalSize = htmlContent.length
    const minifiedSize = minified.length
    const savings = ((1 - minifiedSize / originalSize) * 100).toFixed(1)
    console.log(`  ✓ ${htmlFile} (reduced ${savings}%)`)
  }
}

// Step 4: Copy and minify CSS files
console.log('\nCopying and minifying CSS files...')
const sourceCSSDir = path.join(sourceDir, 'styles')
const cssDir = path.join(distDir, 'styles')

if (await fse.pathExists(sourceCSSDir)) {
  await fse.copy(sourceCSSDir, cssDir)
  const processCSSFiles = async (dir, prefix = '') => {
    const files = await fse.readdir(dir)

    for (const file of files) {
      const filePath = path.join(dir, file)
      const stats = await fse.stat(filePath)

      if (stats.isDirectory()) {
        await processCSSFiles(filePath, prefix + file + '/')
      } else if (file.endsWith('.css')) {
        const cssContent = await fse.readFile(filePath, 'utf-8')

        try {
          const result = cleanCSS.minify(cssContent)

          if (result.errors.length === 0) {
            await fse.writeFile(filePath, result.styles)
            const originalSize = cssContent.length
            const minifiedSize = result.styles.length
            const savings = ((1 - minifiedSize / originalSize) * 100).toFixed(1)
            console.log(`  ✓ styles/${prefix}${file} (reduced ${savings}%)`)
          } else {
            console.log(
              `  ✗ styles/${prefix}${file} minification failed:`,
              result.errors
            )
          }
        } catch (error) {
          console.log(
            `  ⚠ styles/${prefix}${file} (skipped - ${error.message})`
          )
        }
      }
    }
  }

  await processCSSFiles(cssDir)
}

// Step 5: Copy and minify JS files
console.log('\nCopying and minifying JS files...')
const sourceJSDir = path.join(sourceDir, 'js')
const jsDir = path.join(distDir, 'js')

if (await fse.pathExists(sourceJSDir)) {
  await fse.copy(sourceJSDir, jsDir)
  const processJSFiles = async (dir, prefix = '') => {
    const files = await fse.readdir(dir)

    for (const file of files) {
      const filePath = path.join(dir, file)
      const stats = await fse.stat(filePath)

      if (stats.isDirectory()) {
        await processJSFiles(filePath, prefix + file + '/')
      } else if (file.endsWith('.js')) {
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
            console.log(`  ✓ js/${prefix}${file} (reduced ${savings}%)`)
          }
        } catch (error) {
          console.log(`  ⚠ js/${prefix}${file} (skipped - ${error.message})`)
        }
      }
    }
  }

  await processJSFiles(jsDir)
}

console.log('\nBuild completed!\n')
