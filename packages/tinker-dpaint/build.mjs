#!/usr/bin/env zx

import { minify as minifyHTML } from 'html-minifier-terser'
import { minify as minifyJS } from 'terser'
import CleanCSS from 'clean-css'
import fse from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sourceDir = path.join(__dirname, 'DPaint-js')
const distDir = path.join(__dirname, 'dist')

// Resources to copy from DPaint-js to dist
const resourcesToCopy = ['_img', '_font', '_data', 'manifest.json']

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

// Step 3: Copy _script and _style directories first
console.log('\nCopying script and style directories...')
const scriptSourcePath = path.join(sourceDir, '_script')
const scriptDestPath = path.join(distDir, '_script')
const styleSourcePath = path.join(sourceDir, '_style')
const styleDestPath = path.join(distDir, '_style')

if (await fse.pathExists(scriptSourcePath)) {
  await fse.copy(scriptSourcePath, scriptDestPath)
  console.log('  ✓ _script')
}

if (await fse.pathExists(styleSourcePath)) {
  await fse.copy(styleSourcePath, styleDestPath)
  console.log('  ✓ _style')
}

// Step 4: Minify HTML files
console.log('\nMinifying HTML files...')
const htmlFiles = ['index.html']
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

// Step 5: Minify CSS files
console.log('\nMinifying CSS files...')
const styleDir = path.join(distDir, '_style')
if (await fse.pathExists(styleDir)) {
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
            console.log(`  ✓ _style/${prefix}${file} (reduced ${savings}%)`)
          } else {
            console.log(
              `  ✗ _style/${prefix}${file} minification failed:`,
              result.errors
            )
          }
        } catch (error) {
          console.log(
            `  ⚠ _style/${prefix}${file} (skipped - ${error.message})`
          )
        }
      }
    }
  }

  await processCSSFiles(styleDir)
}

// Step 6: Minify JS files in _script directory
console.log('\nMinifying JS files...')
const scriptDir = path.join(distDir, '_script')
if (await fse.pathExists(scriptDir)) {
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
            console.log(`  ✓ _script/${prefix}${file} (reduced ${savings}%)`)
          }
        } catch (error) {
          console.log(
            `  ⚠ _script/${prefix}${file} (skipped - ${error.message})`
          )
        }
      }
    }
  }

  await processJSFiles(scriptDir)
}

console.log('\nBuild completed!\n')
