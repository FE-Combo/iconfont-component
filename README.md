# 动机

- 组件化 Icon，自动化生成 iconfont.cn 的 icon

# 约定

- iconfont 的命名以 icon-为前缀
- 命名连接符使用-
- 样式暂时只支持生成 less 与 scss 的形式
- 暂时只只支持使用 ts

# 使用

- 安装：`yarn add iconfont-component --save` OR `npm install iconfont-component --save`

- 项目配置： - 根目录下生成 icon.js 文件
  ```
    const generate = require('iconfont-component');
    const path = require('path');
    function resolve(relativePath) {
        return path.resolve(\_\_dirname, `./${relativePath}`)
    }
    const iconGenerateConfig = {
        iconHTMLPath: resolve('./icon.html'),
        iconCssPath: resolve('./icon.less'),
        iconFontFilePath: resolve('./font'),
        iconComponentPath: resolve('./Icon.tsx'),
        styleType: 1, // 0 代表 less, 1 代表scss
    }
    generate(iconGenerateConfig)
  ```
- package.json 的 script 新增 "icon": "node icon.js"
- 生成 icon：命令行输入`yarn icon //at.alicdn.com/t/font_1076605_p8g2n70z31.css`
