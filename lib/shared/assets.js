const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const esbuild = require('esbuild');
const { loadTemplatedFile } = require('./templates');

function contentHash(content) {
  return crypto.createHash('md5').update(content).digest('hex').slice(0, 8);
}

function minifyCSS(css) {
  return esbuild.transformSync(css, {
    loader: 'css',
    minify: true,
    legalComments: 'none',
  }).code.trim();
}

function minifyJS(js) {
  return esbuild.transformSync(js, {
    loader: 'js',
    minify: true,
    legalComments: 'none',
  }).code.trim();
}

function getPublicAssetManifest(options) {
  const {
    srcDir,
    config = {},
  } = options;

  const stylesDir = path.join(srcDir, 'styles');
  const scriptsDir = path.join(srcDir, 'scripts');
  const criticalCssPath = path.join(stylesDir, 'critical.css');
  const mainCssPath = path.join(stylesDir, 'main.css');

  const criticalCss = fs.existsSync(criticalCssPath)
    ? minifyCSS(fs.readFileSync(criticalCssPath, 'utf8'))
    : '';

  const mainCss = minifyCSS(fs.readFileSync(mainCssPath, 'utf8'));
  const mainCssHash = contentHash(mainCss);
  const mainCssFilename = `main.${mainCssHash}.css`;

  const scripts = {};
  if (fs.existsSync(scriptsDir)) {
    for (const file of fs.readdirSync(scriptsDir)) {
      if (!file.endsWith('.js') || file.startsWith('_')) {
        continue;
      }

      const templated = loadTemplatedFile(path.join(scriptsDir, file), {
        vars: config,
        partialsDir: scriptsDir,
        partialExtension: '.js',
        missingPartialMode: 'throw',
        strict: true,
      });
      const content = minifyJS(templated);
      const hash = contentHash(content);
      const filename = `${file.replace(/\.js$/, '')}.${hash}.js`;

      scripts[file] = {
        content,
        filename,
        href: `/scripts/${filename}`,
      };
    }
  }

  return {
    criticalCss,
    css: {
      content: mainCss,
      filename: mainCssFilename,
      href: `/styles/${mainCssFilename}`,
    },
    faviconHref: '/favicon.svg',
    fonts: {
      dmSansHref: '/assets/fonts/dm-sans-latin.woff2',
      jetbrainsMonoHref: '/assets/fonts/jetbrains-mono-latin.woff2',
    },
    scripts,
  };
}

module.exports = {
  contentHash,
  getPublicAssetManifest,
  minifyCSS,
  minifyJS,
};
