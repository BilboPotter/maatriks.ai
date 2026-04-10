import fs from 'node:fs';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';

const ROOT = process.cwd();
const ASSETS = path.join(ROOT, 'src', 'assets');
const DM_SANS = path.join(ASSETS, 'fonts', 'dm-sans-latin.woff2');
const JETBRAINS_MONO = path.join(ASSETS, 'fonts', 'jetbrains-mono-latin.woff2');
const BRAND_LOCKUP = path.join(ASSETS, 'brand-lockup-full.svg');
const BRAND_MARK = path.join(ASSETS, 'brand-mark-white.svg');

function svgDataUri(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return `data:image/svg+xml;base64,${Buffer.from(content).toString('base64')}`;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderCard({
  fileName,
  label,
  titleLines,
  description,
  footer,
  accentTitle,
}) {
  const lockupHref = svgDataUri(BRAND_LOCKUP);
  const markHref = svgDataUri(BRAND_MARK);
  const title = titleLines
    .map((line, index) => `<tspan x="96" dy="${index === 0 ? 0 : 88}">${escapeXml(line)}</tspan>`)
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${escapeXml(label)} social card">
  <defs>
    <linearGradient id="bgWash" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#171117"/>
      <stop offset="42%" stop-color="#0c0c10"/>
      <stop offset="100%" stop-color="#08080c"/>
    </linearGradient>
    <radialGradient id="amberGlow" cx="76%" cy="38%" r="42%">
      <stop offset="0%" stop-color="rgba(255,138,31,0.30)"/>
      <stop offset="55%" stop-color="rgba(255,138,31,0.12)"/>
      <stop offset="100%" stop-color="rgba(255,138,31,0)"/>
    </radialGradient>
    <radialGradient id="gridDot" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#2d2d36"/>
      <stop offset="100%" stop-color="transparent"/>
    </radialGradient>
    <pattern id="dotGrid" width="28" height="28" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.1" fill="#2a2a33"/>
    </pattern>
    <linearGradient id="edgeGlow" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#ff8a1f"/>
      <stop offset="100%" stop-color="#ffb347"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bgWash)"/>
  <rect width="1200" height="630" fill="url(#dotGrid)" opacity="0.5"/>
  <rect width="1200" height="630" fill="url(#amberGlow)"/>
  <rect x="0" y="0" width="1200" height="10" fill="url(#edgeGlow)" opacity="0.92"/>

  <image href="${lockupHref}" x="96" y="72" width="318" height="62"/>

  <text x="96" y="176" fill="#ff8a1f" font-family="'JetBrains Mono', monospace" font-size="20" font-weight="600" letter-spacing="5.2">${escapeXml(label)}</text>

  <text x="96" y="258" fill="#f2f2f7" font-family="'DM Sans', sans-serif" font-size="74" font-weight="800" letter-spacing="-3.6">${title}</text>

  <text x="96" y="486" fill="#b9b9c3" font-family="'DM Sans', sans-serif" font-size="30" font-weight="500" letter-spacing="-0.4">${escapeXml(description)}</text>

  <g opacity="0.16">
    <circle cx="960" cy="260" r="178" fill="#ff8a1f"/>
    <circle cx="960" cy="260" r="122" fill="#ffb347"/>
  </g>
  <image href="${markHref}" x="818" y="118" width="284" height="284" opacity="0.92"/>

  <g transform="translate(744 408)">
    <rect width="340" height="134" rx="22" fill="rgba(17,17,24,0.82)" stroke="rgba(255,255,255,0.08)"/>
    <text x="30" y="42" fill="#ffb347" font-family="'JetBrains Mono', monospace" font-size="18" font-weight="600" letter-spacing="3.2">MAATRIKS.AI</text>
    <text x="30" y="84" fill="#f2f2f7" font-family="'DM Sans', sans-serif" font-size="34" font-weight="700" letter-spacing="-1.2">${escapeXml(accentTitle)}</text>
    <text x="30" y="112" fill="#8e8e9a" font-family="'DM Sans', sans-serif" font-size="18" font-weight="500">${escapeXml(footer)}</text>
  </g>

  <rect x="96" y="548" width="196" height="1.5" fill="url(#edgeGlow)" opacity="0.9"/>
  <text x="96" y="586" fill="#8e8e9a" font-family="'JetBrains Mono', monospace" font-size="18" font-weight="500" letter-spacing="2.4">${escapeXml(footer)}</text>
</svg>`;

  const svgPath = path.join(ASSETS, `${fileName}.svg`);
  const pngPath = path.join(ASSETS, `${fileName}.png`);
  fs.writeFileSync(svgPath, svg, 'utf8');

  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: 1200,
    },
    font: {
      loadSystemFonts: true,
      fontFiles: [DM_SANS, JETBRAINS_MONO],
    },
  });

  fs.writeFileSync(pngPath, resvg.render().asPng());
  console.log(`  built: assets/${fileName}.svg`);
  console.log(`  built: assets/${fileName}.png`);
}

renderCard({
  fileName: 'social-default',
  label: 'ADAPTIVE WORKOUT PROGRAMMING',
  titleLines: [
    'Training that adapts',
    'after every session.',
  ],
  description: 'maatriks.ai builds the workout, captures what you actually did, and adjusts the next session accordingly.',
  footer: 'maatriks.ai',
  accentTitle: 'Built for real training',
});

renderCard({
  fileName: 'social-blog',
  label: 'JOURNAL',
  titleLines: [
    'Training software',
    'should change after',
    'the session.',
  ],
  description: 'Notes on adaptive programming, product decisions, and systems that respond to what actually happened.',
  footer: 'maatriks.ai/blog',
  accentTitle: 'Essays and product notes',
});
