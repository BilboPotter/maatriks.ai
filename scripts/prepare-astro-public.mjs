import fs from 'node:fs';
import path from 'node:path';
import { getPublicAssetManifest } from '../astro-src/lib/public-assets.mjs';

const ROOT = process.cwd();
const SRC_ASSETS = path.join(ROOT, 'src', 'assets');
const PUBLIC = path.join(ROOT, 'astro-public');
const PUBLIC_ASSETS = path.join(PUBLIC, 'assets');
const PUBLIC_STYLES = path.join(PUBLIC, 'styles');
const PUBLIC_SCRIPTS = path.join(PUBLIC, 'scripts');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function resetGeneratedDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }

  ensureDir(dirPath);
}

function copyRecursive(sourceDir, targetDir) {
  ensureDir(targetDir);

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      copyRecursive(sourcePath, targetPath);
      continue;
    }

    fs.copyFileSync(sourcePath, targetPath);
  }
}

function buildFaviconIco(outputPath) {
  const sizes = [16, 32, 48];
  const pngEntries = sizes
    .map((size) => ({ size, path: path.join(SRC_ASSETS, `favicon-${size}.png`) }))
    .filter((entry) => fs.existsSync(entry.path))
    .map((entry) => ({ ...entry, buffer: fs.readFileSync(entry.path) }));

  if (!pngEntries.length) {
    return;
  }

  const count = pngEntries.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  const dirEntries = Buffer.alloc(count * 16);
  let offset = 6 + count * 16;

  pngEntries.forEach((entry, index) => {
    const width = entry.size >= 256 ? 0 : entry.size;
    const height = entry.size >= 256 ? 0 : entry.size;
    const dirOffset = index * 16;

    dirEntries.writeUInt8(width, dirOffset + 0);
    dirEntries.writeUInt8(height, dirOffset + 1);
    dirEntries.writeUInt8(0, dirOffset + 2);
    dirEntries.writeUInt8(0, dirOffset + 3);
    dirEntries.writeUInt16LE(1, dirOffset + 4);
    dirEntries.writeUInt16LE(32, dirOffset + 6);
    dirEntries.writeUInt32LE(entry.buffer.length, dirOffset + 8);
    dirEntries.writeUInt32LE(offset, dirOffset + 12);

    offset += entry.buffer.length;
  });

  fs.writeFileSync(outputPath, Buffer.concat([header, dirEntries, ...pngEntries.map((entry) => entry.buffer)]));
}

function main() {
  ensureDir(PUBLIC);
  resetGeneratedDir(PUBLIC_ASSETS);
  resetGeneratedDir(PUBLIC_STYLES);
  resetGeneratedDir(PUBLIC_SCRIPTS);

  copyRecursive(SRC_ASSETS, PUBLIC_ASSETS);

  const manifest = getPublicAssetManifest();
  fs.writeFileSync(path.join(PUBLIC_STYLES, manifest.css.filename), manifest.css.content, 'utf8');

  Object.values(manifest.scripts).forEach((script) => {
    fs.writeFileSync(path.join(PUBLIC_SCRIPTS, script.filename), script.content, 'utf8');
  });

  const faviconSvgPath = path.join(SRC_ASSETS, 'favicon.svg');
  if (fs.existsSync(faviconSvgPath)) {
    fs.copyFileSync(faviconSvgPath, path.join(PUBLIC, 'favicon.svg'));
  }

  buildFaviconIco(path.join(PUBLIC, 'favicon.ico'));
}

main();
