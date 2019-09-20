[![npm version](https://img.shields.io/npm/v/iconfont-component.svg?style=flat)](https://www.npmjs.com/package/iconfont-component)

# 动机

- 组件化 Icon，由 iconfont.cn 自动生成 Icon Component

# 参数

- namespace: 唯一标识，默认为 iconfont
- iconCssPath: css 生成路径
- iconFontFilePath: font 文件生成路径
- iconComponentPath: 组件生成路径

# 约定

- 仅适用于 react/ts 项目

- font-family 的命名必须为 [namespace]
- FontClass/Symbol 前缀必须为 [namespace]-
- icon 命名连接符使用-, e.g: arrow-left、arrow-right
- 组件不能使用数字开头的命名方式,e.g: 666-error(❎)、ok-666(✅)、o666k(✅)

# 使用

- 安装：`yarn add iconfont-component --dev`
- 项目配置：
  - 根目录下生成 icon.js 文件

  ```
    const generate = require('iconfont-component')
    const path = require('path')
    function resolve(relativePath) {
      return path.resolve(`${relativePath}`)
    }
    const iconGenerateConfig = {
      namespace: 'ihtl',
      iconCssPath: resolve('./client/styles/icon.css'),
      iconFontFilePath: resolve('./client/static/fonts'),
      iconComponentPath: resolve('./client/components/common/Icon/index.tsx'),
    }
    generate(iconGenerateConfig)

  ```
- package.json 的 script 新增 "icon": "node icon.js"
- 生成 icon：命令行输入`yarn icon [iconfont.css]`. e.g: `yarn icon //at.alicdn.com/t/font_1076605_p8g2n70z31.css`
- 使用：引用组件 Icon

# TODO
- 支持svg
