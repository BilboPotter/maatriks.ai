import path from 'node:path';
import { createRequire } from 'node:module';
import { siteConfig } from './site.mjs';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const require = createRequire(import.meta.url);
const sharedAssets = require('../../lib/shared/assets.js');
const { getPublicAssetManifest: buildAssetManifest } = sharedAssets;

export function getPublicAssetManifest() {
  return buildAssetManifest({ srcDir: SRC, config: siteConfig });
}
