import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://maatriks.ai',
  output: 'static',
  srcDir: './astro-src',
  publicDir: './astro-public',
  outDir: './astro-dist',
});
