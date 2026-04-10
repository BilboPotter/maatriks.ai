#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const CONFIG = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.config.json'), 'utf8'));

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function resolveScriptFileFromPage(htmlFilePath, scriptNamePrefix) {
  const html = readFile(htmlFilePath);
  const escapedPrefix = scriptNamePrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = html.match(new RegExp(`<script\\s+src="/scripts/(${escapedPrefix}[^"]+)"`, 'i'));

  assert(match?.[1], `Missing ${scriptNamePrefix} script reference in ${htmlFilePath}`);

  return {
    html,
    scriptFileName: match[1],
  };
}

function verifyAuthPage({ htmlPath, scriptNamePrefix, expectedDeepLink, expectedActionId }) {
  assert(fs.existsSync(htmlPath), `Missing built auth page: ${htmlPath}`);

  const { html, scriptFileName } = resolveScriptFileFromPage(htmlPath, scriptNamePrefix);
  assert(html.includes(expectedActionId), `Missing ${expectedActionId} in ${htmlPath}`);
  assert(html.includes('content="no-referrer"'), `Expected no-referrer policy in ${htmlPath}`);
  assert(html.includes('Content-Security-Policy'), `Expected CSP meta in ${htmlPath}`);
  assert(!html.includes('id="cookie-banner"'), `Auth page should not include cookie banner: ${htmlPath}`);
  assert(!html.includes('/scripts/consent'), `Auth page should not include consent script: ${htmlPath}`);

  const scriptPath = path.join(DIST, 'scripts', scriptFileName);
  assert(fs.existsSync(scriptPath), `Missing built auth script: ${scriptPath}`);

  const scriptBody = readFile(scriptPath);
  assert(
    scriptBody.includes(expectedDeepLink),
    `Expected ${scriptFileName} to contain ${expectedDeepLink}`
  );
  assert(
    scriptBody.includes('history.replaceState'),
    `Expected ${scriptFileName} to clear sensitive URL state`
  );
  assert(
    scriptBody.includes('token_hash'),
    `Expected ${scriptFileName} to whitelist token_hash for Supabase flows`
  );
}

function main() {
  verifyAuthPage({
    htmlPath: path.join(DIST, 'auth', 'callback', 'index.html'),
    scriptNamePrefix: 'auth-callback',
    expectedDeepLink: CONFIG.authCallbackDeepLink,
    expectedActionId: 'id="open-app"',
  });

  verifyAuthPage({
    htmlPath: path.join(DIST, 'update-password', 'index.html'),
    scriptNamePrefix: 'update-password',
    expectedDeepLink: CONFIG.passwordResetDeepLink,
    expectedActionId: 'id="open-app"',
  });

  console.log('Verified auth handoff build output.');
}

main();
