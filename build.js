#!/usr/bin/env node

/**
 * Static site builder for maatriks.ai
 * No dependencies — uses Node.js built-ins only.
 *
 * Usage: node build.js
 * Output: dist/
 */

const fs = require('fs');
const path = require('path');
const {
  assertNoUnresolvedPlaceholders,
  createHtmlAliases,
  getSiteHost,
  interpolate,
  resolvePartials,
} = require('./lib/shared/templates');
const { getPublicAssetManifest } = require('./lib/shared/assets');
const {
  generateRSS,
  getBlogIndexViewModel,
  getBlogPostViewModel,
  loadBlogPosts,
} = require('./lib/shared/blog');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');
const BLOG_SRC = path.join(SRC, 'blog');
const CONFIG = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.config.json'), 'utf8'));
const ASSETS = path.join(SRC, 'assets');
const PARTIALS = path.join(SRC, 'partials');
const DEFAULT_REFERRER_POLICY = 'strict-origin-when-cross-origin';
const DEFAULT_SOCIAL_IMAGE = '/assets/social-default.png';
const DEFAULT_SOCIAL_IMAGE_ALT = `${CONFIG.appName} social preview`;
const BLOG_SOCIAL_IMAGE = '/assets/social-blog.png';
const BLOG_SOCIAL_IMAGE_ALT = `${CONFIG.appName} journal social preview`;
const AUTH_SECURITY_META = [
  '<meta http-equiv="Content-Security-Policy" content="default-src \'self\'; base-uri \'none\'; connect-src \'self\'; font-src \'self\'; frame-src \'none\'; img-src \'self\' data:; object-src \'none\'; script-src \'self\'; style-src \'self\' \'unsafe-inline\'; form-action \'self\';">',
  '<meta http-equiv="Cache-Control" content="no-store, max-age=0">',
  '<meta http-equiv="Pragma" content="no-cache">'
].join('\n  ');
const COOKIE_BANNER_HTML = `<div class="cookie-banner" id="cookie-banner" role="dialog" aria-label="Cookie consent">
  <div class="cookie-banner-inner">
    <p>This site uses cookies for analytics.</p>
    <div class="cookie-banner-actions">
      <button type="button" class="btn btn-primary cookie-accept" id="cookie-accept">Accept</button>
      <button type="button" class="btn btn-ghost cookie-decline" id="cookie-decline">Decline</button>
    </div>
  </div>
</div>`;
const CONSENT_SCRIPT_HTML = '<script src="/scripts/consent.js"></script>';

function toAbsoluteSiteUrl(assetPath) {
  if (/^https?:\/\//.test(assetPath)) {
    return assetPath;
  }

  return `${CONFIG.siteUrl}${assetPath.startsWith('/') ? assetPath : `/${assetPath}`}`;
}

// Route definitions: source page → output path
// layout: 'default' = nav + main + footer + main.js; 'auth' = raw content (no wrapper)
// pageClass: extra class on .page wrapper (e.g. 'content-page')
// mainStyle: inline style on <main> tag
const ROUTES = [
  {
    page: 'index.html',
    out: 'index.html',
    canonical: '/',
    layout: 'default',
    pageClass: '',
    mainStyle: 'style="padding:0;"',
    title: 'maatriks — Workout App That Adapts to You',
    description: 'Not sure what to do at the gym? maatriks builds a personalized workout plan, tracks what you actually did, and adjusts your next session automatically. Built for beginners.',
    socialTitle: 'maatriks — Workout App That Adapts to You',
    socialDescription: 'A personalized workout app for beginners. maatriks builds your plan, tracks what you actually did, and adjusts your next session automatically.',
    siteName: 'maatriks',
    structuredData: [
      {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'maatriks',
        applicationCategory: 'HealthApplication',
        operatingSystem: 'iOS, Android',
        description: 'Adaptive workout programming app that builds personalized plans for beginners, tracks real performance, and adjusts automatically after every session.',
        url: 'https://maatriks.ai',
        author: {
          '@type': 'Organization',
          name: 'Riverin OÜ',
          url: 'https://maatriks.ai',
        },
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          availability: 'https://schema.org/ComingSoon',
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Do I need gym experience to use maatriks?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: "No. The app is built for beginners. Tell it your schedule and goals, and it builds your first workout from there. You don't need to know exercises or programming — the app handles that.",
            },
          },
          {
            '@type': 'Question',
            name: 'How does the app know what to change after each workout?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'It uses what you actually logged — sets, reps, weight, and any swaps you made. If you went heavier, it adjusts up. If you cut a session short, it adapts. Every workout informs the next one.',
            },
          },
          {
            '@type': 'Question',
            name: 'Can I change exercises during a workout?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. Swap anything mid-session and the app treats it as part of the record. Your plan adjusts based on what you actually did, not what was originally scheduled.',
            },
          },
          {
            '@type': 'Question',
            name: 'Is this a fixed workout plan or does it change?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'It changes. You start with a structured plan based on your setup, but after each session the app reviews what happened and adjusts what comes next. The longer you use it, the more tailored it gets.',
            },
          },
          {
            '@type': 'Question',
            name: 'How is this different from a personal trainer?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'A trainer costs 50-120 per session. maatriks gives you a personalized plan that adapts after every workout, with written feedback explaining what changed and why. It is not a human coach, but it pays closer attention than a static app or a spreadsheet.',
            },
          },
        ],
      },
    ],
  },
  { page: 'privacy.html', out: 'privacy/index.html', canonical: '/privacy', layout: 'default', pageClass: 'content-page', title: `Privacy Policy — ${CONFIG.appName}`, description: `Privacy policy for ${CONFIG.appName}, operated by ${CONFIG.companyName}.` },
  { page: 'support.html', out: 'support/index.html', canonical: '/support', layout: 'default', pageClass: 'content-page', title: `Support — ${CONFIG.appName}`, description: `Get help with ${CONFIG.appName}. Contact ${CONFIG.supportEmail}.` },
  { page: 'delete-account.html', out: 'delete-account/index.html', canonical: '/delete-account', layout: 'default', pageClass: 'content-page', noindex: true, title: `Delete Account — ${CONFIG.appName}`, description: `How to delete your ${CONFIG.appName} account and what happens to your data.` },
  { page: 'forgot-password.html', out: 'forgot-password/index.html', canonical: '/forgot-password', layout: 'default', pageClass: 'content-page', noindex: true, title: `Reset Password — ${CONFIG.appName}`, description: `How to reset your ${CONFIG.appName} password.` },
  { page: 'auth-callback.html', out: 'auth/callback/index.html', canonical: '/auth/callback', layout: 'auth', noindex: true, sensitive: true, title: `Redirecting — ${CONFIG.appName}`, description: `Authentication redirect for ${CONFIG.appName}.` },
  { page: 'update-password.html', out: 'update-password/index.html', canonical: '/update-password', layout: 'auth', noindex: true, sensitive: true, title: `Update Password — ${CONFIG.appName}`, description: `Password recovery redirect for ${CONFIG.appName}.` },
];

function copyDirSync(src, dest, relativeRoot) {
  if (!fs.existsSync(src)) {
    return;
  }

  fs.mkdirSync(dest, { recursive: true });

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    const relativePath = relativeRoot ? `${relativeRoot}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath, relativePath);
      continue;
    }

    fs.copyFileSync(srcPath, destPath);
    console.log(`  copied: assets/${relativePath}`);
  }
}

function composePage(route, pageContent, navPartial, footerPartial, jsMap) {
  if (route.layout === 'auth') {
    // Auth pages provide their own full structure (no nav/footer/main wrapper)
    return pageContent;
  }

  const pageClass = route.pageClass ? `page ${route.pageClass}` : 'page';
  const mainStyle = route.mainStyle ? ` ${route.mainStyle}` : '';
  const mainJsName = jsMap['main.js'] || 'main.js';

  return `<div class="${pageClass}">
${navPartial}
  <main class="main" id="main-content"${mainStyle}>
${pageContent}
  </main>

${footerPartial}
</div>
<script src="/scripts/${mainJsName}"></script>`;
}

function replaceAssetPaths(html, cssFilename, jsMap) {
  html = html.split('/styles/main.css').join(`/styles/${cssFilename}`);
  for (const [orig, hashed] of Object.entries(jsMap)) {
    html = html.split(`/scripts/${orig}`).join(`/scripts/${hashed}`);
  }
  return html;
}

function build() {
  // Clean dist
  if (fs.existsSync(DIST)) {
    fs.rmSync(DIST, { recursive: true });
  }

  const layout = fs.readFileSync(path.join(SRC, 'pages', '_layout.html'), 'utf8');
  const navPartial = fs.readFileSync(path.join(SRC, 'pages', '_nav.html'), 'utf8');
  const footerPartial = fs.readFileSync(path.join(SRC, 'pages', '_footer.html'), 'utf8');

  const assetManifest = getPublicAssetManifest({ srcDir: SRC, config: CONFIG });
  const cssFilename = assetManifest.css.filename;
  const criticalCss = assetManifest.criticalCss;
  const jsMap = Object.fromEntries(
    Object.entries(assetManifest.scripts).map(([file, script]) => [file, script.filename])
  );
  const stylesDir = path.join(DIST, 'styles');
  fs.mkdirSync(stylesDir, { recursive: true });
  fs.writeFileSync(path.join(stylesDir, cssFilename), assetManifest.css.content, 'utf8');
  console.log(`  built: styles/${cssFilename}`);

  // Build JS with content hashes
  const distScripts = path.join(DIST, 'scripts');
  fs.mkdirSync(distScripts, { recursive: true });
  for (const script of Object.values(assetManifest.scripts)) {
    fs.writeFileSync(path.join(distScripts, script.filename), script.content, 'utf8');
    console.log(`  built: scripts/${script.filename}`);
  }

  // Build each route
  for (const route of ROUTES) {
    let rawContent = fs.readFileSync(path.join(SRC, 'pages', route.page), 'utf8');
    rawContent = resolvePartials(rawContent, { partialsDir: PARTIALS, missingPartialMode: 'throw' });
    const composedContent = composePage(route, rawContent, navPartial, footerPartial, jsMap);

    const canonicalUrl = CONFIG.siteUrl + route.canonical;
    const robotsMeta = route.noindex
      ? '<meta name="robots" content="noindex, nofollow">'
      : '<meta name="robots" content="index, follow">';
    const structuredDataHtml = (route.structuredData || [])
      .map((entry) => `<script type="application/ld+json">${JSON.stringify(entry)}</script>`)
      .join('\n  ');
    const vars = {
      ...CONFIG,
      pageTitle: route.title,
      pageDescription: route.description,
      socialTitle: route.socialTitle || route.title,
      socialDescription: route.socialDescription || route.description,
      siteName: route.siteName || CONFIG.appName,
      canonicalUrl: canonicalUrl,
      socialImageUrl: toAbsoluteSiteUrl(DEFAULT_SOCIAL_IMAGE),
      socialImageAlt: DEFAULT_SOCIAL_IMAGE_ALT,
      robotsMeta: robotsMeta,
      structuredDataHtml: structuredDataHtml,
      criticalCss: criticalCss,
      referrerPolicy: route.sensitive ? 'no-referrer' : DEFAULT_REFERRER_POLICY,
      securityMeta: route.sensitive ? AUTH_SECURITY_META : '',
      consentBanner: route.sensitive ? '' : COOKIE_BANNER_HTML,
      consentScript: route.sensitive ? '' : CONSENT_SCRIPT_HTML,
      content: composedContent,
    };

    let html = interpolate(layout, vars);
    // Second pass for nested interpolations (content may contain config refs)
    html = interpolate(html, vars);

    // Replace asset paths with hashed versions
    html = replaceAssetPaths(html, cssFilename, jsMap);
    assertNoUnresolvedPlaceholders(html, route.out);

    const outPath = path.join(DIST, route.out);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, html, 'utf8');
    console.log(`  built: ${route.out}`);

    for (const alias of createHtmlAliases(route.out)) {
      const aliasPath = path.join(DIST, alias);
      fs.mkdirSync(path.dirname(aliasPath), { recursive: true });
      fs.writeFileSync(aliasPath, html, 'utf8');
      console.log(`  built: ${alias}`);
    }
  }

  // Copy assets
  copyDirSync(ASSETS, path.join(DIST, 'assets'));

  // Copy root favicon (SVG) for backwards compatibility
  const faviconPath = path.join(ASSETS, 'favicon.svg');
  if (fs.existsSync(faviconPath)) {
    fs.writeFileSync(path.join(DIST, 'favicon.svg'), fs.readFileSync(faviconPath, 'utf8'), 'utf8');
    console.log('  built: favicon.svg');
  }

  // Build favicon.ico from pre-rendered PNGs (ICO = header + directory + embedded PNGs)
  const icoSizes = [16, 32, 48];
  const icoPngs = icoSizes
    .map(s => ({ size: s, path: path.join(ASSETS, `favicon-${s}.png`) }))
    .filter(f => fs.existsSync(f.path))
    .map(f => ({ size: f.size, data: fs.readFileSync(f.path) }));

  if (icoPngs.length > 0) {
    const count = icoPngs.length;
    const headerSize = 6;
    const dirSize = 16 * count;
    let offset = headerSize + dirSize;

    // ICO header: reserved(2) + type=1(2) + count(2)
    const header = Buffer.alloc(headerSize);
    header.writeUInt16LE(0, 0);
    header.writeUInt16LE(1, 2);
    header.writeUInt16LE(count, 4);

    const dirEntries = Buffer.alloc(dirSize);
    const pngBuffers = [];

    for (let i = 0; i < count; i++) {
      const { size, data } = icoPngs[i];
      const w = size >= 256 ? 0 : size;
      const h = size >= 256 ? 0 : size;
      dirEntries.writeUInt8(w, i * 16);           // width
      dirEntries.writeUInt8(h, i * 16 + 1);       // height
      dirEntries.writeUInt8(0, i * 16 + 2);       // color palette
      dirEntries.writeUInt8(0, i * 16 + 3);       // reserved
      dirEntries.writeUInt16LE(1, i * 16 + 4);    // color planes
      dirEntries.writeUInt16LE(32, i * 16 + 6);   // bits per pixel
      dirEntries.writeUInt32LE(data.length, i * 16 + 8);  // size
      dirEntries.writeUInt32LE(offset, i * 16 + 12);      // offset
      pngBuffers.push(data);
      offset += data.length;
    }

    fs.writeFileSync(path.join(DIST, 'favicon.ico'), Buffer.concat([header, dirEntries, ...pngBuffers]));
    console.log('  built: favicon.ico');
  }

  // Blog
  const blogIndexRoute = { layout: 'default', pageClass: 'content-page blog-page' };
  const blogPostRoute = { layout: 'default', pageClass: 'content-page blog-page blog-post-page' };
  const posts = loadBlogPosts(BLOG_SRC);
  const blogIndexTemplate = resolvePartials(fs.readFileSync(path.join(SRC, 'pages', 'blog-index.html'), 'utf8'), {
    partialsDir: PARTIALS,
    missingPartialMode: 'throw',
  });
  const blogPostTemplate = resolvePartials(fs.readFileSync(path.join(SRC, 'pages', 'blog-post.html'), 'utf8'), {
    partialsDir: PARTIALS,
    missingPartialMode: 'throw',
  });
  const blogDir = path.join(DIST, 'blog');

  // Build blog index
  const blogIndexComposed = composePage(blogIndexRoute, blogIndexTemplate, navPartial, footerPartial, jsMap);
  const blogIndexVars = {
    ...CONFIG,
    pageTitle: `Blog — ${CONFIG.appName}`,
    pageDescription: `Writing from ${CONFIG.appName} on training, programming, product design, and building the app.`,
    socialTitle: `Blog — ${CONFIG.appName}`,
    socialDescription: `Writing from ${CONFIG.appName} on training, programming, product design, and building the app.`,
    siteName: CONFIG.appName,
    canonicalUrl: `${CONFIG.siteUrl}/blog`,
    socialImageUrl: toAbsoluteSiteUrl(BLOG_SOCIAL_IMAGE),
    socialImageAlt: BLOG_SOCIAL_IMAGE_ALT,
    robotsMeta: '<meta name="robots" content="index, follow">',
    structuredDataHtml: '',
    criticalCss: criticalCss,
    referrerPolicy: DEFAULT_REFERRER_POLICY,
    securityMeta: '',
    consentBanner: COOKIE_BANNER_HTML,
    consentScript: CONSENT_SCRIPT_HTML,
    ...getBlogIndexViewModel(posts),
    content: blogIndexComposed,
  };

  let blogIndexHtml = interpolate(layout, blogIndexVars);
  blogIndexHtml = interpolate(blogIndexHtml, blogIndexVars);
  blogIndexHtml = replaceAssetPaths(blogIndexHtml, cssFilename, jsMap);
  assertNoUnresolvedPlaceholders(blogIndexHtml, 'blog/index.html');

  fs.mkdirSync(blogDir, { recursive: true });
  fs.writeFileSync(path.join(blogDir, 'index.html'), blogIndexHtml, 'utf8');
  console.log('  built: blog/index.html');

  // Build individual posts
  for (const post of posts) {
    const postComposed = composePage(blogPostRoute, blogPostTemplate, navPartial, footerPartial, jsMap);
    const postVars = {
      ...CONFIG,
      pageTitle: `${post.title} — ${CONFIG.appName}`,
      pageDescription: post.description,
      socialTitle: `${post.title} — ${CONFIG.appName}`,
      socialDescription: post.description,
      siteName: CONFIG.appName,
      canonicalUrl: `${CONFIG.siteUrl}/blog/${post.slug}`,
      socialImageUrl: toAbsoluteSiteUrl(BLOG_SOCIAL_IMAGE),
      socialImageAlt: BLOG_SOCIAL_IMAGE_ALT,
      robotsMeta: '<meta name="robots" content="index, follow">',
      structuredDataHtml: '',
      criticalCss: criticalCss,
      referrerPolicy: DEFAULT_REFERRER_POLICY,
      securityMeta: '',
      consentBanner: COOKIE_BANNER_HTML,
      consentScript: CONSENT_SCRIPT_HTML,
      ...getBlogPostViewModel(post, posts),
      content: postComposed,
    };

    let postHtml = interpolate(layout, postVars);
    postHtml = interpolate(postHtml, postVars);
    postHtml = replaceAssetPaths(postHtml, cssFilename, jsMap);
    assertNoUnresolvedPlaceholders(postHtml, `blog/${post.slug}/index.html`);

    const postDir = path.join(blogDir, post.slug);
    fs.mkdirSync(postDir, { recursive: true });
    fs.writeFileSync(path.join(postDir, 'index.html'), postHtml, 'utf8');
    console.log(`  built: blog/${post.slug}/index.html`);
  }

  // RSS feed
  fs.writeFileSync(path.join(blogDir, 'feed.xml'), generateRSS(posts, CONFIG), 'utf8');
  console.log('  built: blog/feed.xml');

  // CNAME for GitHub Pages custom domain
  fs.writeFileSync(path.join(DIST, 'CNAME'), `${getSiteHost(CONFIG.siteUrl)}\n`, 'utf8');
  console.log('  built: CNAME');

  // 404.html
  const notFoundRoute = { layout: 'default', pageClass: 'content-page' };
  const notFoundRaw = resolvePartials(fs.readFileSync(path.join(SRC, 'pages', '404.html'), 'utf8'), {
    partialsDir: PARTIALS,
    missingPartialMode: 'throw',
  });
  const notFoundComposed = composePage(notFoundRoute, notFoundRaw, navPartial, footerPartial, jsMap);
  const notFoundVars = {
    ...CONFIG,
    pageTitle: `Page Not Found — ${CONFIG.appName}`,
    pageDescription: `The page you are looking for does not exist.`,
    socialTitle: `Page Not Found — ${CONFIG.appName}`,
    socialDescription: `The page you are looking for does not exist.`,
    siteName: CONFIG.appName,
    canonicalUrl: CONFIG.siteUrl,
    socialImageUrl: toAbsoluteSiteUrl(DEFAULT_SOCIAL_IMAGE),
    socialImageAlt: DEFAULT_SOCIAL_IMAGE_ALT,
    robotsMeta: '<meta name="robots" content="noindex, nofollow">',
    structuredDataHtml: '',
    criticalCss: criticalCss,
    referrerPolicy: DEFAULT_REFERRER_POLICY,
    securityMeta: '',
    consentBanner: COOKIE_BANNER_HTML,
    consentScript: CONSENT_SCRIPT_HTML,
    content: notFoundComposed,
  };
  let notFoundHtml = interpolate(layout, notFoundVars);
  notFoundHtml = interpolate(notFoundHtml, notFoundVars);
  notFoundHtml = replaceAssetPaths(notFoundHtml, cssFilename, jsMap);
  assertNoUnresolvedPlaceholders(notFoundHtml, '404.html');
  fs.writeFileSync(path.join(DIST, '404.html'), notFoundHtml, 'utf8');
  console.log('  built: 404.html');

  // Sitemap — public pages only
  const sitemapUrls = ROUTES
    .filter(r => !r.noindex)
    .map(r => `  <url><loc>${CONFIG.siteUrl}${r.canonical}</loc></url>`);

  sitemapUrls.push(`  <url><loc>${CONFIG.siteUrl}/blog</loc></url>`);
  for (const post of posts) {
    sitemapUrls.push(`  <url><loc>${CONFIG.siteUrl}/blog/${post.slug}</loc></url>`);
  }

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.join('\n')}
</urlset>`;
  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemapXml, 'utf8');
  console.log('  built: sitemap.xml');

  // robots.txt
  const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${CONFIG.siteUrl}/sitemap.xml`;
  fs.writeFileSync(path.join(DIST, 'robots.txt'), robotsTxt, 'utf8');
  console.log('  built: robots.txt');

  // .nojekyll to disable Jekyll processing
  fs.writeFileSync(path.join(DIST, '.nojekyll'), '', 'utf8');
  console.log('  built: .nojekyll');

  console.log('\nDone. Output in dist/');
}

build();
