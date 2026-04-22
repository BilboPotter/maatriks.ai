import fs from 'node:fs';
import path from 'node:path';
import { loadBlogPosts } from './astro-src/lib/blog.mjs';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'astro-dist');
const CONFIG = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.config.json'), 'utf8'));

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function getSiteHost(siteUrl) {
  try {
    return new URL(siteUrl).host;
  } catch {
    return siteUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '');
  }
}

function readFile(relativePath, encoding = 'utf8') {
  const fullPath = path.join(DIST, relativePath);
  assert(fs.existsSync(fullPath), `Missing required file: ${fullPath}`);
  return fs.readFileSync(fullPath, encoding);
}

function assertExists(relativePath) {
  readFile(relativePath);
}

function resolveScriptFileFromPage(relativeHtmlPath, scriptNamePrefix) {
  const html = readFile(relativeHtmlPath);
  const escapedPrefix = scriptNamePrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = html.match(new RegExp(`<script\\s+src="/scripts/(${escapedPrefix}[^"]+)"`, 'i'));

  assert(match?.[1], `Missing ${scriptNamePrefix} script reference in ${relativeHtmlPath}`);

  return {
    html,
    scriptFileName: match[1],
  };
}

function verifyHtmlRoutes() {
  const htmlFiles = [
    'index.html',
    '404.html',
    'terms/index.html',
    'terms.html',
    'privacy/index.html',
    'privacy.html',
    'support/index.html',
    'support.html',
    'delete-account/index.html',
    'delete-account.html',
    'forgot-password/index.html',
    'forgot-password.html',
    'auth/callback/index.html',
    'auth/callback.html',
    'update-password/index.html',
    'update-password.html',
    'blog/index.html',
  ];

  htmlFiles.forEach(assertExists);
}

function verifyBlogPosts() {
  const posts = loadBlogPosts();
  const expectedSlugs = posts.map((post) => post.slug).sort();
  const blogDir = path.join(DIST, 'blog');
  const builtSlugs = fs.readdirSync(blogDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  assert(
    builtSlugs.join('\n') === expectedSlugs.join('\n'),
    'Blog post directories in astro-dist do not match src/blog slugs'
  );

  expectedSlugs.forEach((slug) => assertExists(path.join('blog', slug, 'index.html')));
}

function verifyStaticArtifacts() {
  [
    'blog/feed.xml',
    'robots.txt',
    'sitemap.xml',
    'CNAME',
    '.nojekyll',
    'favicon.svg',
    'favicon.ico',
    '.well-known/apple-app-site-association',
    'apple-app-site-association',
    'assets/social-home.png',
    'assets/social-blog.png',
  ].forEach(assertExists);

  const cname = readFile('CNAME').trim();
  assert(cname === getSiteHost(CONFIG.siteUrl), `Unexpected CNAME value: ${cname}`);

  const robots = readFile('robots.txt');
  assert(robots.includes(`Sitemap: ${CONFIG.siteUrl}/sitemap.xml`), 'robots.txt is missing the sitemap URL');

  const sitemap = readFile('sitemap.xml');
  [
    `${CONFIG.siteUrl}/`,
    `${CONFIG.siteUrl}/privacy`,
    `${CONFIG.siteUrl}/terms`,
    `${CONFIG.siteUrl}/support`,
    `${CONFIG.siteUrl}/blog`,
  ].forEach((url) => {
    assert(sitemap.includes(`<loc>${url}</loc>`), `sitemap.xml is missing ${url}`);
  });
}

function verifyAssetFingerprinting() {
  const indexHtml = readFile('index.html');
  const cssMatch = indexHtml.match(/href="(\/styles\/main\.[^"]+\.css)"/);

  assert(cssMatch?.[1], 'Homepage is missing the hashed stylesheet reference');
  assertExists(cssMatch[1].slice(1));
  assert(
    indexHtml.includes(`${CONFIG.siteUrl}/assets/social-home.png`),
    'Homepage metadata is missing the current social preview image'
  );

  assert(
    !fs.existsSync(path.join(DIST, 'styles', 'main.css')),
    'astro-dist/styles/main.css should not exist after postprocess cleanup'
  );

  [
    'auth-callback.js',
    'update-password.js',
    'main.js',
    'consent.js',
  ].forEach((fileName) => {
    assert(
      !fs.existsSync(path.join(DIST, 'scripts', fileName)),
      `astro-dist/scripts/${fileName} should not exist after postprocess cleanup`
    );
  });
}

function verifyAuthPage({ htmlPath, scriptNamePrefix, expectedDeepLink, expectedActionId }) {
  const { html, scriptFileName } = resolveScriptFileFromPage(htmlPath, scriptNamePrefix);

  assert(html.includes(expectedActionId), `Missing ${expectedActionId} in ${htmlPath}`);
  assert(html.includes('content="no-referrer"'), `Expected no-referrer policy in ${htmlPath}`);
  assert(html.includes('Content-Security-Policy'), `Expected CSP meta in ${htmlPath}`);
  assert(!html.includes('id="cookie-banner"'), `Auth page should not include cookie banner: ${htmlPath}`);
  assert(!html.includes('/scripts/consent'), `Auth page should not include consent script: ${htmlPath}`);

  const scriptBody = readFile(path.join('scripts', scriptFileName));
  assert(scriptBody.includes(expectedDeepLink), `Expected ${scriptFileName} to contain ${expectedDeepLink}`);
  assert(scriptBody.includes('history.replaceState'), `Expected ${scriptFileName} to clear sensitive URL state`);
  assert(scriptBody.includes('token_hash'), `Expected ${scriptFileName} to whitelist token_hash for Supabase flows`);
  assert(scriptBody.includes('auth_state'), `Expected ${scriptFileName} to preserve auth_state for mobile OAuth handoff`);
}

function verifyAppleAppSiteAssociation() {
  const expectedAppId = 'F796PAYWY9.ai.maatriks.app';

  [
    '.well-known/apple-app-site-association',
    'apple-app-site-association',
  ].forEach((relativePath) => {
    const json = JSON.parse(readFile(relativePath));
    const details = json?.applinks?.details;

    assert(Array.isArray(details), `Expected applinks.details array in ${relativePath}`);
    assert(
      details.some((entry) => entry?.appID === expectedAppId),
      `Expected ${relativePath} to include appID ${expectedAppId}`
    );
  });
}

function main() {
  verifyHtmlRoutes();
  verifyBlogPosts();
  verifyStaticArtifacts();
  verifyAssetFingerprinting();

  verifyAuthPage({
    htmlPath: 'auth/callback/index.html',
    scriptNamePrefix: 'auth-callback',
    expectedDeepLink: CONFIG.authCallbackDeepLink,
    expectedActionId: 'id="open-app"',
  });

  verifyAuthPage({
    htmlPath: 'update-password/index.html',
    scriptNamePrefix: 'update-password',
    expectedDeepLink: CONFIG.passwordResetDeepLink,
    expectedActionId: 'id="open-app"',
  });

  verifyAppleAppSiteAssociation();

  console.log('Verified Astro build output.');
}

main();
