[![npm version](https://img.shields.io/npm/v/iconfont-component.svg?style=flat)](https://www.npmjs.com/package/iconfont-component)

# 动机

- 组件化 Icon，由 iconfont.cn 自动生成强类型 Icon Component，并支持 svg。

# 参数

- namespace: 唯一标识，默认值为 iconfont
- iconJsPath: js 生成路径，用于 svg 的使用
- iconCssPath: css 生成路径
- iconFontFilePath: font 文件生成路径
- iconComponentPath: 组件生成路径

# 约定

- 仅适用于 react/ts 项目
- font-family 的命名必须为 [namespace]
- FontClass/Symbol 前缀必须为 [namespace]-
- icon 命名连接符使用-, e.g: arrow-left、arrow-right
- 组件不能使用数字开头的命名方式, e.g: 666-error(❎)、ok-666(✅)、o666k(✅)

# 使用

- 安装：`yarn add iconfont-component --dev`
- 项目配置：

  - 根目录下生成 icon.js 文件

  ```
    const generate = require('iconfont-component')
    const path = require('path')
    function resolve(relativePath) {
      return path.resolve(__dirname, `./${relativePath}`)
    }
    const iconGenerateConfig = {
      namespace: 'icon',
      iconCssPath: resolve('styles/icon.css'),
      iconFontFilePath: resolve('static/fonts'),
      iconComponentPath: resolve('components/Icon/index.tsx'),
    }
    generate(iconGenerateConfig)

  ```

  - package.json 新增 script: node icon.js
  - 生成 icon：命令行输入`yarn icon [iconfont url]`. e.g: `yarn icon //at.alicdn.com/t/font_1076605_p8g2n70z31.css` or `yarn icon //at.alicdn.com/t/font_1076605_p8g2n70z31.js` or `yarn icon //at.alicdn.com/t/font_1076605_p8g2n70z31`

- 组件 Icon 的引入

  ```
  import Icon, { IconClass } from '@/components/Icon'
  function IconSample(){
    return <Icon type={IconClass.MENU} />
  }
  // 如果需要使用svg的形式 props中添加参数symbol，eg: <Icon type={IconClass.MENU} symbol/>
  ```
