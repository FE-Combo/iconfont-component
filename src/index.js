const chalk = require("chalk");
const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");
const yargs = require("yargs");
const Agent = require("https").Agent;
const childProcess = require("child_process");
const htmlBoilerplatePath = path.resolve(__dirname, "./template/icon.html");
const cssBoilerplatePath = path.resolve(__dirname, "./template/iconfont.css");
const componentBoilerplatePath = path.resolve(__dirname, "./template/Icon.tsx");

function checkIfExistsFile(path) {
  return fs.existsSync(path);
}

function analyzeCSS(content, config) {
  // Process icon items
  const { componentPath, cssPath, namespace } = config;
  const matchIconRegex = new RegExp(`\\.${namespace}-(.*)\\:before`, "g");

  const contentMatchIcon = content.match(matchIconRegex);
  if (!contentMatchIcon)
    throw new Error(
      `Error occurred, it perhaps caused by wrong configuration of iconfont.cn, please check: 1."fontclass / symbol prefix" must be ${config.namespace}-; 2."Font Family" must be ${config.namespace}`
    );
  const classList = contentMatchIcon.map((_) =>
    _.substr(1).replace(":before", "")
  );

  // {1}: Icon types {2}: css url {3}: namespace
  const cssImportPath = path.relative(path.join(componentPath, ".."), cssPath);
  
  if (!checkIfExistsFile(cssPath)) {
    fs.createFileSync(cssPath);
  }

  const componentContent = fs
    .readFileSync(componentBoilerplatePath)
    .toString()
    .replace(
      "// {1}",
      classList.map((_) => `${classNameToEnum(_, config)} = "${_}",`).join("\n")
    )
    .replace(
      "{2}",
      cssImportPath.startsWith("../") ? cssImportPath : `./${cssImportPath}`
    )
    .replace(/\{3\}/g, namespace);

  // Process URLs (assets)
  const assetIconRegex = new RegExp(`\\.${namespace}-(.|\\n)*?\\}`, "g");
  const assetURLs = content
    .match(/url\('(.|\n)*?'\)/g)
    .map((_) => _.substring(5, _.length - 2));
  // {1}: fonts url {2}: icon style {3}: namespace
  const cssContent = fs
    .readFileSync(cssBoilerplatePath)
    .toString()
    .replace(
      `'{1}'`,
      assetURLs
        .map((url) => transformToLocalURL(url, config))
        .filter((_) => _)
        .join(",")
    )
    .replace(`// {2}`, content.match(assetIconRegex).join("\n"))
    .replace(/\{3\}/g, namespace);

  if (!checkIfExistsFile(componentPath)) {
    fs.createFileSync(componentPath);
  }

  fs.writeFileSync(componentPath, componentContent);
  fs.writeFileSync(cssPath, cssContent);

  return classList;
}

function generatePreviewHtml(iconList, cssURL, config) {
  const { htmlPath, namespace } = config;
  const icons = iconList.map(
    (_) =>
      `<div class="item"><i class="iconfont ${_}"></i><span>${classNameToEnum(
        _,
        config
      )}</span></div>`
  );

  // {1}: css url {2}: content {3}: date  {4}: namespace
  fs.writeFileSync(
    htmlPath,
    fs
      .readFileSync(htmlBoilerplatePath)
      .toString()
      .replace("{1}", cssURL)
      .replace("{2}", icons.join(""))
      .replace("{3}", new Date().toLocaleString())
      .replace("{4}", namespace)
  );
}

function classNameToEnum(className, config) {
  const { namespace } = config;
  const regex = new RegExp(`^${namespace}\\-[a-z\\d]+(-[a-z\\d]+)*$`);
  if (!regex.test(className)) {
    throw new Error(`${className} does not conform to naming convention`);
  }

  return className
    .substring(namespace.length + 1)
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
    } else if (assetExtension === "svg") {
      downloadFontAsset(url, "iconfont.svg", config);
      return `url("${fontPath}/iconfont.svg") format("svg")`;
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

  // Why not use mkdirSync: deep directory will not be created
  const path = assetFolderPath + "/" + fileName;
  if (!checkIfExistsFile(path)) {
    fs.createFileSync(path);
  }

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
    httpsAgent: new Agent({ rejectUnauthorized: false }),
  });
  return response.data;
}

function spawn(command, arguments) {
  const isWindows = process.platform === "win32";
  const result = childProcess.spawnSync(
    isWindows ? command + ".cmd" : command,
    arguments,
    {
      stdio: "inherit",
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
  const url = yargs.argv._[0];

  try {
    if (!url) throw new Error("Missing CSS URL in command line");

    const cssURL = url.replace(/(\.css)|(\.js)$/, "").concat(".css");
    const jsURL = url.replace(/(\.css)|(\.js)$/, "").concat(".js");

    // TODO: check params if null
    const config = {
      namespace: env.namespace || "iconfont",
      jsPath: env.iconJsPath,
      cssPath: env.iconCssPath,
      assetFolderPath: env.iconFontFilePath,
      componentPath: env.iconComponentPath,
      htmlPath: env.iconHTMLPath,
      prettierConfig:
        env.prettierConfig || path.resolve(__dirname, "../prettier.json"),
    };

    const cssContent = await getContent(cssURL);
    console.info(chalk`{white.bold 😍 CSS file content loaded}`);
    const iconClassList = analyzeCSS(cssContent, config);
    console.info(
      chalk`{white.bold 😍 Generated ${iconClassList.length} icons}`
    );

    const jsContent = await getContent(jsURL);
    console.info(chalk`{white.bold 😍 JS file content loaded}`);
    if (config.jsPath) {
      fs.writeFileSync(config.jsPath, jsContent);
      console.info(chalk`{white.bold 😍 Generated JS}`);
    }

    if (config.htmlPath) {
      generatePreviewHtml(iconClassList, cssURL, config);
      console.info(chalk`{white.bold 😍 Generated HTML for preview}`);
    }

    spawn("prettier", [
      "--config",
      config.prettierConfig,
      "--write",
      config.cssPath,
    ]);
    spawn("prettier", [
      "--config",
      config.prettierConfig,
      "--write",
      config.componentPath,
    ]);
    console.info(chalk`{white.bold 💕 Format generated files}`);
  } catch (e) {
    console.error(chalk`{red.bold ❌ Error: ${e.message}}`);
    process.exit(1);
  }
}

module.exports = generate;
