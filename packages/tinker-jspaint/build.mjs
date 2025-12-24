#!/usr/bin/env zx

import { minify as minifyHTML } from 'html-minifier-terser'
import { minify as minifyJS } from 'terser'
import CleanCSS from 'clean-css'
import fse from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import { glob } from 'glob'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sourceDir = path.join(__dirname, 'jspaint')
const distDir = path.join(__dirname, 'dist')

// Resources to copy from jspaint to dist (based on existing dist structure)
const resourcesToCopy = [
  'images',
  'lib',
  'src',
  'styles',
  'audio',
  'localization',
  'help',
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
const htmlFiles = ['index.html']
for (const htmlFile of htmlFiles) {
  const sourcePath = path.join(sourceDir, htmlFile)
  const destPath = path.join(distDir, htmlFile)

  if (await fse.pathExists(sourcePath)) {
    const htmlContent = await fse.readFile(sourcePath, 'utf-8')
    let minified = await minifyHTML(htmlContent, htmlMinifyOptions)

    // Remove Content-Security-Policy meta tag
    minified = minified.replace(
      /<meta\s+http-equiv=["']Content-Security-Policy["'][^>]*>/gi,
      ''
    )

    await fse.writeFile(destPath, minified)

    const originalSize = htmlContent.length
    const minifiedSize = minified.length
    const savings = ((1 - minifiedSize / originalSize) * 100).toFixed(1)
    console.log(`  ✓ ${htmlFile} (reduced ${savings}%)`)
  }
}

// Step 4: Minify CSS files
console.log('\nMinifying CSS files...')
const cssDir = path.join(distDir, 'styles')
if (await fse.pathExists(cssDir)) {
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

// Step 5: Minify JS files in src directory
console.log('\nMinifying JS files...')
const srcDir = path.join(distDir, 'src')
if (await fse.pathExists(srcDir)) {
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
            ecma: 2020, // Support modern JavaScript syntax
            compress: {
              dead_code: true,
              drop_console: false,
              drop_debugger: true,
            },
            mangle: false, // Keep variable names readable
            format: {
              comments: false,
            },
          })

          if (result.code) {
            await fse.writeFile(filePath, result.code)
            const originalSize = jsContent.length
            const minifiedSize = result.code.length
            const savings = ((1 - minifiedSize / originalSize) * 100).toFixed(1)
            console.log(`  ✓ src/${prefix}${file} (reduced ${savings}%)`)
          }
        } catch (error) {
          console.log(`  ⚠ src/${prefix}${file} (skipped - ${error.message})`)
        }
      }
    }
  }

  await processJSFiles(srcDir)
}

// Step 6: Minify JS files in lib directory
const libDir = path.join(distDir, 'lib')
if (await fse.pathExists(libDir)) {
  const libFiles = await fse.readdir(libDir)

  for (const file of libFiles) {
    const filePath = path.join(libDir, file)
    const stats = await fse.stat(filePath)

    if (stats.isFile() && file.endsWith('.js')) {
      const jsContent = await fse.readFile(filePath, 'utf-8')

      try {
        const result = await minifyJS(jsContent, {
          ecma: 2020, // Support modern JavaScript syntax
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
          console.log(`  ✓ lib/${file} (reduced ${savings}%)`)
        }
      } catch (error) {
        console.log(`  ⚠ lib/${file} (skipped - ${error.message})`)
      }
    }
  }
}

// Step 7: Remove all .map files from dist directory
console.log('\nRemoving sourcemap files...')
const mapFiles = await glob('**/*.map', { cwd: distDir, absolute: true })
for (const mapFile of mapFiles) {
  await fse.remove(mapFile)
}
console.log(`  ✓ Removed ${mapFiles.length} sourcemap file(s)`)

console.log('\nBuild completed!\n')
