import fs from 'node:fs';
import path from 'node:path';
import { siteConfig } from './site.mjs';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const PAGES = path.join(SRC, 'pages');
const PARTIALS = path.join(SRC, 'partials');
const SCRIPTS = path.join(SRC, 'scripts');

function interpolate(content, vars = siteConfig) {
  return content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return vars[key] !== undefined ? vars[key] : match;
  });
}

function resolvePartials(content) {
  return content.replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (match, name) => {
    const partialPath = path.join(PARTIALS, `${name}.html`);
    if (!fs.existsSync(partialPath)) {
      return match;
    }

    return resolvePartials(fs.readFileSync(partialPath, 'utf8'));
  });
}

export function loadLegacyPage(pageName, vars = siteConfig) {
  const filePath = path.join(PAGES, pageName);
  const raw = fs.readFileSync(filePath, 'utf8');
  return interpolate(resolvePartials(raw), vars);
}

export function loadLegacyScript(scriptName, vars = siteConfig) {
  const filePath = path.join(SCRIPTS, scriptName);
  const raw = fs.readFileSync(filePath, 'utf8');
  return interpolate(raw, vars);
}

export const cookieBannerHtml = `<div class="cookie-banner" id="cookie-banner" role="dialog" aria-label="Cookie consent">
  <div class="cookie-banner-inner">
    <p>This site uses cookies for analytics.</p>
    <div class="cookie-banner-actions">
      <button type="button" class="btn btn-primary cookie-accept" id="cookie-accept">Accept</button>
      <button type="button" class="btn btn-ghost cookie-decline" id="cookie-decline">Decline</button>
    </div>
  </div>
</div>`;
