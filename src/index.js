const chalk = require("chalk");
const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");
const yargs = require("yargs");
const Agent = require("https").Agent;
const childProcess = require("child_process");
const htmlBoilerplatePath = path.resolve(__dirname, "./template/icon.html");
const lessBoilerplatePath = path.resolve(__dirname, "./template/iconfont.less");
const componentBoilerplatePath = path.resolve(__dirname, "./template/Icon.tsx");

function analyzeCSS(content, config) {
  // Process icon items
  const { componentPath, cssPath } = config;
  const classList = content
    .match(/\.icon-(.*)\:before/g)
    .map(_ => _.substr(1).replace(":before", ""));
  const componentContent = fs
    .readFileSync(componentBoilerplatePath)
    .toString()
    .replace(
      "// {1}",
      classList.map(_ => `${classNameToEnum(_)} = "${_}",`).join("\n")
    )
    .replace("{2}", path.relative(path.join(componentPath, ".."), cssPath));

  // Process URLs (assets)
  const assetURLs = content
    .match(/url\('(.|\n)*?'\)/g)
    .map(_ => _.substring(5, _.length - 2));
  let cssContent = fs
    .readFileSync(lessBoilerplatePath)
    .toString()
    .replace(
      `"{1}"`,
      assetURLs
        .map(url => transformToLocalURL(url, config))
        .filter(_ => _)
        .join(",")
    );
  cssContent = cssContent.replace(
    `// {2}`,
    content.match(/\.icon-(.|\n)*?\}/g).join("\n")
  );
  fs.writeFileSync(componentPath, componentContent);
  fs.writeFileSync(cssPath, cssContent);

  return classList;
}

function generatePreviewHtml(iconList, cssURL, config) {
  const { htmlPath } = config;
  const icons = iconList.map(
    _ =>
      `<div class="item"><i class="iconfont ${_}"></i><span>${classNameToEnum(
        _
      )}</span></div>`
  );
  fs.writeFileSync(
    htmlPath,
    fs
      .readFileSync(htmlBoilerplatePath)
      .toString()
      .replace("{1}", cssURL)
      .replace("{2}", icons.join(""))
      .replace("{3}", new Date().toLocaleString())
  );
}

function classNameToEnum(className) {
  if (!/^icon\-[a-z\d]+(-[a-z\d]+)*$/.test(className)) {
    throw new Error(`${className} does not conform to naming convention`);
  }

  return className
    .substring(5)
    .replace(/-/g, "_")
    .toUpperCase();
}

function transformToLocalURL(url, config) {
  const { cssPath, assetFolderPath } = config;
  if (url.startsWith("data:application/x-font-woff2;")) {
    return `url("${url}") format("woff")`;
  } else {
    const assetExtension = getExtension(url);
    const fontPath = path.relative(path.join(cssPath, ".."), assetFolderPath);
    if (assetExtension === "ttf") {
      downloadFontAsset(url, "iconfont.ttf", config);
      return `url("${fontPath}/iconfont.ttf") format("truetype")`;
    } else if (assetExtension === "woff") {
      downloadFontAsset(url, "iconfont.woff", config);
      return `url("${fontPath}/iconfont.woff") format("woff")`;
    } else {
      return null;
    }
  }
}

function getExtension(url) {
  let extension = url.substr(url.lastIndexOf(".") + 1);
  const questionMarkIndex = extension.indexOf("?");
  if (questionMarkIndex > 0) extension = extension.substr(0, questionMarkIndex);
  return extension.toLowerCase();
}

async function downloadFontAsset(url, fileName, config) {
  const { assetFolderPath } = config;
  if (!fs.existsSync(assetFolderPath)) {
    fs.mkdirSync(assetFolderPath);
  }

  const path = assetFolderPath + "/" + fileName;
  if (url.startsWith("//")) url = "http:" + url;
  const response = await axios({ url, responseType: "stream" });
  response.data.pipe(fs.createWriteStream(path));
  return new Promise((resolve, reject) => {
    response.data.on("end", resolve);
    response.data.on("error", reject);
  });
}

async function getContent(url) {
  if (url.startsWith("//")) url = "http:" + url;
  const response = await axios.get(url, {
    httpsAgent: new Agent({ rejectUnauthorized: false })
  });
  return response.data;
}

function spawn(command, arguments) {
  const isWindows = process.platform === "win32";
  const result = childProcess.spawnSync(
    isWindows ? command + ".cmd" : command,
    arguments,
    {
      stdio: "inherit"
    }
  );
  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(
      `non-zero exit code returned, code=${
        result.status
      }, command=${command} ${arguments.join(" ")}`
    );
    process.exit(1);
  }
}

async function generate(env) {
  console.info(chalk`{white.bold usage:} 🎈 yarn icon \{icon-font-css-url\}`);
  const cssURL = yargs.argv._[0];

  try {
    if (!cssURL) throw new Error("Missing CSS URL in command line");
    // TODO: check params if null
    const config = {
      https: env.https || false,
      port: env.port || 3000,
      cssPath: env.iconCssPath,
      assetFolderPath: env.iconFontFilePath,
      componentPath: env.iconComponentPath,
      htmlPath: env.iconHTMLPath,
      prettierConfig:
        env.prettierConfig || path.resolve(__dirname, "../prettier.json")
    };

    const cssContent = await getContent(cssURL);
    console.info(chalk`{white.bold 😍 CSS file content loaded}`);
    const iconClassList = analyzeCSS(cssContent, config);
    console.info(
      chalk`{white.bold 😍 Generated ${iconClassList.length} icons}`
    );

    generatePreviewHtml(iconClassList, cssURL, config);
    console.info(chalk`{white.bold 😍 Generated HTML for preview}`);

    spawn("prettier", [
      "--config",
      config.prettierConfig,
      "--write",
      config.cssPath
    ]);
    spawn("prettier", [
      "--config",
      config.prettierConfig,
      "--write",
      config.componentPath
    ]);
    console.info(chalk`{white.bold 💕 Format generated files}`);
    console.info(
      chalk`show on {green ${config.https ? "https" : "http"}://localhost:${
        config.port
      }/} \n`
    );
  } catch (e) {
    console.error(chalk`{red.bold ❌ Error: ${e.message}}`);
    process.exit(1);
  }
}

module.exports = generate;
