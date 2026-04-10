import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { siteConfig } from './site.mjs';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const PAGES = path.join(SRC, 'pages');
const PARTIALS = path.join(SRC, 'partials');
const SCRIPTS = path.join(SRC, 'scripts');
const require = createRequire(import.meta.url);
const sharedTemplates = require('../../lib/shared/templates.js');
const { assertNoUnresolvedPlaceholders, interpolate, loadTemplatedFile } = sharedTemplates;

export function loadLegacyPartial(partialName, vars = siteConfig) {
  const filePath = path.join(PARTIALS, `${partialName}.html`);
  return loadTemplatedFile(filePath, {
    vars,
    partialsDir: PARTIALS,
    missingPartialMode: 'throw',
    strict: true,
  });
}

export function loadLegacyScript(scriptName, vars = siteConfig) {
  const filePath = path.join(SCRIPTS, scriptName);
  const raw = fs.readFileSync(filePath, 'utf8');
  return assertNoUnresolvedPlaceholders(interpolate(raw, vars), filePath);
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
