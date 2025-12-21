#!/usr/bin/env zx

import { minify as minifyHTML } from 'html-minifier-terser'
import { minify as minifyJS } from 'terser'
import CleanCSS from 'clean-css'
import fse from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sourceDir = path.join(__dirname, 'motionity/src')
const distDir = path.join(__dirname, 'dist')

// Resources to copy from motionity/src to dist
const resourcesToCopy = ['assets', 'favicon.ico', 'meta.png']

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

// Step 3: Copy and minify HTML file
console.log('\nMinifying HTML file...')
const htmlSource = path.join(sourceDir, 'index.html')
const htmlDest = path.join(distDir, 'index.html')

if (await fse.pathExists(htmlSource)) {
  const htmlContent = await fse.readFile(htmlSource, 'utf-8')
  const minified = await minifyHTML(htmlContent, htmlMinifyOptions)
  await fse.writeFile(htmlDest, minified)

  const originalSize = htmlContent.length
  const minifiedSize = minified.length
  const savings = ((1 - minifiedSize / originalSize) * 100).toFixed(1)
  console.log(`  ✓ index.html (reduced ${savings}%)`)
}

// Step 4: Copy and minify CSS files
console.log('\nMinifying CSS files...')
const cssFiles = [
  'magic-check.min.css',
  'nice-select.css',
  'pickr.css',
  'range-slider.min.css',
  'styles.css',
]

for (const cssFile of cssFiles) {
  const sourcePath = path.join(sourceDir, cssFile)
  const destPath = path.join(distDir, cssFile)

  if (await fse.pathExists(sourcePath)) {
    const cssContent = await fse.readFile(sourcePath, 'utf-8')

    try {
      const result = cleanCSS.minify(cssContent)

      if (result.errors.length === 0) {
        await fse.writeFile(destPath, result.styles)
        const originalSize = cssContent.length
        const minifiedSize = result.styles.length
        const savings = ((1 - minifiedSize / originalSize) * 100).toFixed(1)
        console.log(`  ✓ ${cssFile} (reduced ${savings}%)`)
      } else {
        console.log(`  ✗ ${cssFile} minification failed:`, result.errors)
      }
    } catch (error) {
      console.log(`  ⚠ ${cssFile} (skipped - ${error.message})`)
    }
  }
}

// Step 5: Copy js directory and minify JS files
console.log('\nMinifying JS files...')
const jsSourceDir = path.join(sourceDir, 'js')
const jsDestDir = path.join(distDir, 'js')

if (await fse.pathExists(jsSourceDir)) {
  await fse.ensureDir(jsDestDir)

  const processJSFiles = async (dir, prefix = '') => {
    const files = await fse.readdir(dir)

    for (const file of files) {
      const filePath = path.join(dir, file)
      const stats = await fse.stat(filePath)

      if (stats.isDirectory()) {
        const subDir = path.join(jsDestDir, prefix, file)
        await fse.ensureDir(subDir)
        await processJSFiles(filePath, prefix ? path.join(prefix, file) : file)
      } else if (file.endsWith('.js')) {
        const jsContent = await fse.readFile(filePath, 'utf-8')
        const destPath = path.join(jsDestDir, prefix, file)

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
            await fse.writeFile(destPath, result.code)
            const originalSize = jsContent.length
            const minifiedSize = result.code.length
            const savings = ((1 - minifiedSize / originalSize) * 100).toFixed(1)
            console.log(
              `  ✓ js/${
                prefix ? prefix + '/' : ''
              }${file} (reduced ${savings}%)`
            )
          }
        } catch (error) {
          console.log(
            `  ⚠ js/${prefix ? prefix + '/' : ''}${file} (skipped - ${
              error.message
            })`
          )
        }
      }
    }
  }

  await processJSFiles(jsSourceDir)
}

console.log('\nBuild completed!\n')
