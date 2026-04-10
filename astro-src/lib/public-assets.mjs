import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { siteConfig } from './site.mjs';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const STYLES = path.join(SRC, 'styles');
const SCRIPTS = path.join(SRC, 'scripts');

function contentHash(content) {
  return crypto.createHash('md5').update(content).digest('hex').slice(0, 8);
}

function minifyCSS(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\n\s*\/\/[^\n]*/g, '')
    .replace(/\s*\n\s*/g, '')
    .replace(/\s*([{}:;,>~+])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();
}

function minifyJS(js) {
  let result = '';
  let index = 0;

  while (index < js.length) {
    if (js[index] === '/' && js[index + 1] === '/') {
      while (index < js.length && js[index] !== '\n') index += 1;
      continue;
    }

    if (js[index] === '/' && js[index + 1] === '*') {
      index += 2;
      while (index < js.length && !(js[index] === '*' && js[index + 1] === '/')) index += 1;
      index += 2;
      continue;
    }

    if (js[index] === "'" || js[index] === '"' || js[index] === '`') {
      const quote = js[index];
      result += js[index];
      index += 1;

      while (index < js.length && js[index] !== quote) {
        if (js[index] === '\\') {
          result += js[index];
          index += 1;
        }

        result += js[index];
        index += 1;
      }

      if (index < js.length) {
        result += js[index];
        index += 1;
      }

      continue;
    }

    if (/\s/.test(js[index])) {
      const before = result.length > 0 ? result[result.length - 1] : '';
      while (index < js.length && /\s/.test(js[index])) index += 1;
      const after = index < js.length ? js[index] : '';
      if (/\w/.test(before) && /[\w$]/.test(after)) {
        result += ' ';
      }
      continue;
    }

    result += js[index];
    index += 1;
  }

  return result.trim();
}

function interpolate(content, vars = siteConfig) {
  return content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return vars[key] !== undefined ? vars[key] : match;
  });
}

export function getPublicAssetManifest() {
  const criticalCssPath = path.join(STYLES, 'critical.css');
  const mainCssPath = path.join(STYLES, 'main.css');

  const criticalCss = fs.existsSync(criticalCssPath)
    ? minifyCSS(fs.readFileSync(criticalCssPath, 'utf8'))
    : '';

  const mainCss = minifyCSS(fs.readFileSync(mainCssPath, 'utf8'));
  const mainCssHash = contentHash(mainCss);
  const mainCssFilename = `main.${mainCssHash}.css`;

  const scripts = {};
  for (const file of fs.readdirSync(SCRIPTS)) {
    if (!file.endsWith('.js')) {
      continue;
    }

    const raw = fs.readFileSync(path.join(SCRIPTS, file), 'utf8');
    const content = minifyJS(interpolate(raw));
    const hash = contentHash(content);
    const filename = `${file.replace(/\.js$/, '')}.${hash}.js`;

    scripts[file] = {
      content,
      filename,
      href: `/scripts/${filename}`,
    };
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
