import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const LEGACY_DIST = path.join(ROOT, 'dist');
const ASTRO_DIST = path.join(ROOT, 'astro-dist');

function normalizeHtml(content) {
  return content.replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim();
}

function assertExists(relativePath, baseDir) {
  const fullPath = path.join(baseDir, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing required file: ${fullPath}`);
  }
  return fullPath;
}

function compareFile(relativePath, type = 'text') {
  const legacyPath = assertExists(relativePath, LEGACY_DIST);
  const astroPath = assertExists(relativePath, ASTRO_DIST);

  const legacyContent = fs.readFileSync(legacyPath, type === 'binary' ? null : 'utf8');
  const astroContent = fs.readFileSync(astroPath, type === 'binary' ? null : 'utf8');

  const same = type === 'html'
    ? normalizeHtml(legacyContent) === normalizeHtml(astroContent)
    : Buffer.compare(
        Buffer.isBuffer(legacyContent) ? legacyContent : Buffer.from(legacyContent),
        Buffer.isBuffer(astroContent) ? astroContent : Buffer.from(astroContent)
      ) === 0;

  if (!same) {
    throw new Error(`Parity check failed for ${relativePath}`);
  }
}

function compareDirectory(relativeDir) {
  const legacyDir = path.join(LEGACY_DIST, relativeDir);
  const astroDir = path.join(ASTRO_DIST, relativeDir);
  const legacyFiles = fs.readdirSync(legacyDir).sort();
  const astroFiles = fs.readdirSync(astroDir).sort();

  if (legacyFiles.join('\n') !== astroFiles.join('\n')) {
    throw new Error(`File list mismatch in ${relativeDir}`);
  }

  legacyFiles.forEach((fileName) => {
    compareFile(path.join(relativeDir, fileName));
  });
}

function compareBlogPosts() {
  const legacyBlogDir = path.join(LEGACY_DIST, 'blog');
  const astroBlogDir = path.join(ASTRO_DIST, 'blog');

  const legacyEntries = fs.readdirSync(legacyBlogDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  const astroEntries = fs.readdirSync(astroBlogDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  if (legacyEntries.join('\n') !== astroEntries.join('\n')) {
    throw new Error('Blog post directory mismatch between legacy and Astro outputs');
  }

  legacyEntries.forEach((slug) => {
    compareFile(path.join('blog', slug, 'index.html'), 'html');
  });
}

const htmlFiles = [
  'index.html',
  '404.html',
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

htmlFiles.forEach((file) => compareFile(file, 'html'));
compareBlogPosts();

[
  'blog/feed.xml',
  'robots.txt',
  'sitemap.xml',
  'CNAME',
  '.nojekyll',
  'favicon.svg',
  'favicon.ico',
].forEach((file) => compareFile(file, file.endsWith('.ico') ? 'binary' : 'text'));

compareDirectory('styles');
compareDirectory('scripts');

console.log('Verified Astro build parity against legacy dist output.');
