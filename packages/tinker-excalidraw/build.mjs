#!/usr/bin/env zx

// 进入 excalidraw 目录
cd('excalidraw')

// 安装依赖
await $`yarn`

// 构建项目
await $`yarn build`

// 返回上级目录
cd('..')

// 清理并创建 dist 目录
await $`rm -rf dist`
await $`mkdir -p dist`

// 复制构建产物到 dist 目录
await $`cp -r excalidraw/excalidraw-app/build/* dist/`

console.log(chalk.green('✓ Build completed successfully!'))
