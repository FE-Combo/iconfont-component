# 动机

- 组件化 Icon，由 iconfont.cn 自动生成 Icon Component

# 约定

- iconfont 的命名以 icon-为前缀
- 命名连接符使用-
- 样式暂时只支持生成 less 与 scss 的形式，默认值为 1（0=>less,1=>scss）
- 仅支持使用 tsx

# 使用

- 安装：`yarn add iconfont-component --save` OR `npm install iconfont-component --save`

- 项目配置：
  - 根目录下生成 icon.js 文件
  ```
   const generate = require('iconfont-component')
  const path = require('path')
  function resolve(relativePath) {
  return path.resolve(\_\_dirname, `${relativePath}`)
  }
  const iconGenerateConfig = {
  iconHTMLPath: resolve('./icon.html'),
  iconCssPath: resolve('./client/styles/icon.css'),
  iconFontFilePath: resolve('./client/static/fonts'),
  iconComponentPath: resolve('./client/components/common/Icon/index.tsx'),
  }
  generate(iconGenerateConfig)
  ```
- package.json 的 script 新增 "icon": "node icon.js"
- 生成 icon：命令行输入`yarn icon [iconfont.css]`. e.g: `yarn icon //at.alicdn.com/t/font_1076605_p8g2n70z31.css` OR `npm run icon //at.alicdn.com/t/font_1076605_p8g2n70z31.css`
- 直接引用组件 Icon 使用
