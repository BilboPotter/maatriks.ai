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
const crypto = require('crypto');

function contentHash(content) {
  return crypto.createHash('md5').update(content).digest('hex').slice(0, 8);
}

const ROOT = __dirname;
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');
const BLOG_SRC = path.join(SRC, 'blog');
const CONFIG = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.config.json'), 'utf8'));
const ASSETS = path.join(SRC, 'assets');
const CRITICAL_CSS = path.join(SRC, 'styles', 'critical.css');
const DEFAULT_REFERRER_POLICY = 'strict-origin-when-cross-origin';
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

function getSiteHost(siteUrl) {
  try {
    return new URL(siteUrl).host;
  } catch {
    return siteUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '');
  }
}

// Route definitions: source page → output path
// layout: 'default' = nav + main + footer + main.js; 'auth' = raw content (no wrapper)
// pageClass: extra class on .page wrapper (e.g. 'content-page')
// mainStyle: inline style on <main> tag
const ROUTES = [
  { page: 'index.html', out: 'index.html', canonical: '/', layout: 'default', pageClass: '', mainStyle: 'style="padding:0;"', title: `${CONFIG.appName} — ${CONFIG.appTagline}`, description: CONFIG.appDescription },
  { page: 'privacy.html', out: 'privacy/index.html', canonical: '/privacy', layout: 'default', pageClass: 'content-page', title: `Privacy Policy — ${CONFIG.appName}`, description: `Privacy policy for ${CONFIG.appName}, operated by ${CONFIG.companyName}.` },
  { page: 'support.html', out: 'support/index.html', canonical: '/support', layout: 'default', pageClass: 'content-page', title: `Support — ${CONFIG.appName}`, description: `Get help with ${CONFIG.appName}. Contact ${CONFIG.supportEmail}.` },
  { page: 'delete-account.html', out: 'delete-account/index.html', canonical: '/delete-account', layout: 'default', pageClass: 'content-page', noindex: true, title: `Delete Account — ${CONFIG.appName}`, description: `How to delete your ${CONFIG.appName} account and what happens to your data.` },
  { page: 'forgot-password.html', out: 'forgot-password/index.html', canonical: '/forgot-password', layout: 'default', pageClass: 'content-page', noindex: true, title: `Reset Password — ${CONFIG.appName}`, description: `How to reset your ${CONFIG.appName} password.` },
  { page: 'auth-callback.html', out: 'auth/callback/index.html', canonical: '/auth/callback', layout: 'auth', noindex: true, sensitive: true, title: `Redirecting — ${CONFIG.appName}`, description: `Authentication redirect for ${CONFIG.appName}.` },
  { page: 'update-password.html', out: 'update-password/index.html', canonical: '/update-password', layout: 'auth', noindex: true, sensitive: true, title: `Update Password — ${CONFIG.appName}`, description: `Password recovery redirect for ${CONFIG.appName}.` },
];

function minifyCSS(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')   // block comments
    .replace(/\n\s*\/\/[^\n]*/g, '')     // line comments (non-standard but safe)
    .replace(/\s*\n\s*/g, '')            // newlines + surrounding whitespace
    .replace(/\s*([{}:;,>~+])\s*/g, '$1') // whitespace around syntax chars
    .replace(/;}/g, '}')                 // trailing semicolons
    .trim();
}

function minifyJS(js) {
  // Preserve strings and regex, strip comments and collapse whitespace
  var result = '';
  var i = 0;
  while (i < js.length) {
    // Single-line comment
    if (js[i] === '/' && js[i+1] === '/') {
      while (i < js.length && js[i] !== '\n') i++;
      continue;
    }
    // Block comment
    if (js[i] === '/' && js[i+1] === '*') {
      i += 2;
      while (i < js.length && !(js[i] === '*' && js[i+1] === '/')) i++;
      i += 2;
      continue;
    }
    // String literals — preserve as-is
    if (js[i] === "'" || js[i] === '"' || js[i] === '`') {
      var quote = js[i];
      result += js[i++];
      while (i < js.length && js[i] !== quote) {
        if (js[i] === '\\') { result += js[i++]; }
        result += js[i++];
      }
      if (i < js.length) result += js[i++];
      continue;
    }
    // Collapse whitespace
    if (/\s/.test(js[i])) {
      // Keep one space if bordered by word chars (avoid merging identifiers)
      var before = result.length > 0 ? result[result.length - 1] : '';
      while (i < js.length && /\s/.test(js[i])) i++;
      var after = i < js.length ? js[i] : '';
      if (/\w/.test(before) && /[\w$]/.test(after)) result += ' ';
      continue;
    }
    result += js[i++];
  }
  return result.trim();
}

function interpolate(html, vars) {
  return html.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return vars[key] !== undefined ? vars[key] : match;
  });
}

function resolvePartials(html) {
  return html.replace(/\{\{>\s*([\w-]+)\s*\}\}/g, function (match, name) {
    const partialPath = path.join(SRC, 'partials', `${name}.html`);
    if (fs.existsSync(partialPath)) {
      return fs.readFileSync(partialPath, 'utf8');
    }

    console.warn(`  warning: partial not found: ${name}`);
    return match;
  });
}

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

function createHtmlAliases(routeOut) {
  if (routeOut === 'index.html') {
    return [];
  }

  if (!routeOut.endsWith('/index.html')) {
    return [];
  }

  const routeBase = routeOut.slice(0, -'/index.html'.length);
  return [`${routeBase}.html`];
}

function parseBlogPost(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const metaMatch = raw.match(/<!--meta\s*([\s\S]*?)-->/);
  if (!metaMatch) return null;

  const meta = JSON.parse(metaMatch[1]);
  const content = raw.slice(metaMatch[0].length).trim();
  return { ...meta, content };
}

function loadBlogPosts() {
  if (!fs.existsSync(BLOG_SRC)) return [];

  const posts = [];
  for (const file of fs.readdirSync(BLOG_SRC)) {
    if (file.startsWith('_')) continue;
    if (!file.endsWith('.html')) continue;
    const post = parseBlogPost(path.join(BLOG_SRC, file));
    if (post) posts.push(post);
  }

  // Sort newest first
  posts.sort((a, b) => b.date.localeCompare(a.date));
  return posts.map((post, index) => {
    const readingMinutes = estimateReadingTime(post.content);

    return {
      ...post,
      category: post.category || 'Training',
      readingMinutes,
      readingTimeLabel: `${readingMinutes} min read`,
      dateShort: formatBlogDate(post.date, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      dateLong: formatBlogDate(post.date, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
      isFeatured: index === 0,
    };
  });
}

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function stripHTML(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function estimateReadingTime(html) {
  const plainText = stripHTML(html);
  if (!plainText) return 3;

  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  return Math.max(3, Math.ceil(wordCount / 220));
}

function formatBlogDate(dateString, options) {
  try {
    const date = new Date(`${dateString}T00:00:00Z`);
    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch {
    return dateString;
  }
}

function renderTopicPills(posts) {
  const categories = [...new Set(posts.map(post => post.category))];
  return categories.map(category => (
    `<span class="blog-topic-pill">${escapeHTML(category)}</span>`
  )).join('\n');
}

function renderBlogFeature(post) {
  if (!post) {
    return '';
  }

  return `<section class="blog-feature-section">
    <article class="blog-feature-card">
      <a class="blog-feature-link" href="/blog/${escapeHTML(post.slug)}">
        <div class="blog-card-meta">
          <span class="blog-kicker">${escapeHTML(post.category)}</span>
          <span>${escapeHTML(post.dateShort)}</span>
          <span>${escapeHTML(post.readingTimeLabel)}</span>
        </div>
        <div class="blog-feature-body">
          <p class="blog-feature-label">Featured article</p>
          <h2>${escapeHTML(post.title)}</h2>
          <p>${escapeHTML(post.description)}</p>
        </div>
        <span class="blog-read-link">Read article</span>
      </a>
    </article>
  </section>`;
}

function renderBlogFeed(posts) {
  if (!posts.length) {
    return `<article class="blog-list-card blog-list-card--empty">
      <p class="blog-feature-label">More writing soon</p>
      <h3>New essays are on the way.</h3>
      <p>The journal is still young, but new posts on training, programming, and product design are on the way.</p>
    </article>`;
  }

  return posts.map(post => (
    `<article class="blog-list-card">
      <a class="blog-list-link" href="/blog/${escapeHTML(post.slug)}">
        <div class="blog-card-meta">
          <span class="blog-kicker">${escapeHTML(post.category)}</span>
          <span>${escapeHTML(post.dateShort)}</span>
          <span>${escapeHTML(post.readingTimeLabel)}</span>
        </div>
        <div class="blog-list-copy">
          <h3>${escapeHTML(post.title)}</h3>
          <p>${escapeHTML(post.description)}</p>
        </div>
        <span class="blog-read-link">Open</span>
      </a>
    </article>`
  )).join('\n');
}

function renderBlogArchive(posts) {
  if (!posts.length) {
    return '';
  }

  return `<section class="blog-feed-section section-block">
    <div class="container">
      <div class="blog-section-head">
        <div>
          <p class="blog-feature-label">Latest writing</p>
          <h2>Essays and product notes</h2>
        </div>
      </div>

      <div class="blog-list">
        ${renderBlogFeed(posts)}
      </div>
    </div>
  </section>`;
}

function renderRelatedPosts(currentPost, posts) {
  const related = posts.filter(post => post.slug !== currentPost.slug).slice(0, 3);

  if (!related.length) {
    return `<section class="blog-related-section blog-related-section--solo">
      <div class="container">
        <div class="blog-related-empty">
          <p class="blog-feature-label">Journal</p>
          <h2>More writing is coming.</h2>
          <p>More notes on training, adaptation, and building the app will land here soon.</p>
          <a href="/blog" class="btn btn-ghost">Back to all posts</a>
        </div>
      </div>
    </section>`;
  }

  return `<section class="blog-related-section">
    <div class="container">
      <div class="blog-section-head">
        <div>
          <p class="blog-feature-label">Continue reading</p>
          <h2>More from the journal</h2>
        </div>
        <a href="/blog" class="blog-section-link">All posts</a>
      </div>
      <div class="blog-related-grid">
        ${related.map(post => `
          <article class="blog-related-card">
            <a href="/blog/${escapeHTML(post.slug)}" class="blog-related-link">
              <div class="blog-card-meta">
                <span class="blog-kicker">${escapeHTML(post.category)}</span>
                <span>${escapeHTML(post.dateShort)}</span>
              </div>
              <h3>${escapeHTML(post.title)}</h3>
              <p>${escapeHTML(post.description)}</p>
            </a>
          </article>
        `).join('\n')}
      </div>
    </div>
  </section>`;
}

function generateRSS(posts) {
  const items = posts.map(post => {
    const url = `${CONFIG.siteUrl}/blog/${post.slug}`;
    return `    <item>
      <title>${escapeXML(post.title)}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <description>${escapeXML(post.description)}</description>
    </item>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${CONFIG.appName} Blog</title>
    <link>${CONFIG.siteUrl}/blog</link>
    <description>Writing from ${CONFIG.appName}</description>
    <language>en</language>
    <atom:link href="${CONFIG.siteUrl}/blog/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;
}

function escapeXML(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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

  // Build CSS with content hash
  const cssRaw = fs.readFileSync(path.join(SRC, 'styles', 'main.css'), 'utf8');
  const cssMinified = minifyCSS(cssRaw);
  const cssHash = contentHash(cssMinified);
  const cssFilename = `main.${cssHash}.css`;
  const criticalCss = fs.existsSync(CRITICAL_CSS)
    ? minifyCSS(fs.readFileSync(CRITICAL_CSS, 'utf8'))
    : '';
  const stylesDir = path.join(DIST, 'styles');
  fs.mkdirSync(stylesDir, { recursive: true });
  fs.writeFileSync(path.join(stylesDir, cssFilename), cssMinified, 'utf8');
  console.log(`  built: styles/${cssFilename}`);

  // Build JS with content hashes
  const jsMap = {}; // maps original filename to hashed filename
  const scriptsDir = path.join(SRC, 'scripts');
  if (fs.existsSync(scriptsDir)) {
    const distScripts = path.join(DIST, 'scripts');
    fs.mkdirSync(distScripts, { recursive: true });
    for (const file of fs.readdirSync(scriptsDir)) {
      if (file.endsWith('.js')) {
        const content = fs.readFileSync(path.join(scriptsDir, file), 'utf8');
        const minified = minifyJS(interpolate(content, CONFIG));
        const hash = contentHash(minified);
        const base = file.replace('.js', '');
        const hashedName = `${base}.${hash}.js`;
        jsMap[file] = hashedName;
        fs.writeFileSync(path.join(distScripts, hashedName), minified, 'utf8');
        console.log(`  built: scripts/${hashedName}`);
      }
    }
  }

  // Build each route
  for (const route of ROUTES) {
    let rawContent = fs.readFileSync(path.join(SRC, 'pages', route.page), 'utf8');
    rawContent = resolvePartials(rawContent);
    const composedContent = composePage(route, rawContent, navPartial, footerPartial, jsMap);

    const canonicalUrl = CONFIG.siteUrl + route.canonical;
    const robotsMeta = route.noindex ? '<meta name="robots" content="noindex, nofollow">\n  ' : '';
    const vars = {
      ...CONFIG,
      pageTitle: route.title,
      pageDescription: route.description,
      canonicalUrl: canonicalUrl,
      robotsMeta: robotsMeta,
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
  const posts = loadBlogPosts();
  const blogIndexTemplate = resolvePartials(fs.readFileSync(path.join(SRC, 'pages', 'blog-index.html'), 'utf8'));
  const blogPostTemplate = resolvePartials(fs.readFileSync(path.join(SRC, 'pages', 'blog-post.html'), 'utf8'));
  const featuredPost = posts[0] || null;
  const archivePosts = featuredPost ? posts.slice(1) : [];
  const blogPostCountLabel = posts.length === 0
    ? 'Archive opening soon'
    : posts.length === 1
      ? '1 article live'
      : `${posts.length} articles live`;
  const blogDir = path.join(DIST, 'blog');

  // Build blog index
  const blogIndexComposed = composePage(blogIndexRoute, blogIndexTemplate, navPartial, footerPartial, jsMap);
  const blogIndexVars = {
    ...CONFIG,
    pageTitle: `Blog — ${CONFIG.appName}`,
    pageDescription: `Writing from ${CONFIG.appName} on training, programming, product design, and building the app.`,
    canonicalUrl: `${CONFIG.siteUrl}/blog`,
    robotsMeta: '',
    criticalCss: criticalCss,
    referrerPolicy: DEFAULT_REFERRER_POLICY,
    securityMeta: '',
    consentBanner: COOKIE_BANNER_HTML,
    consentScript: CONSENT_SCRIPT_HTML,
    blogTopics: renderTopicPills(posts),
    featuredPost: renderBlogFeature(featuredPost),
    blogArchive: renderBlogArchive(archivePosts),
    blogPostCount: blogPostCountLabel,
    content: blogIndexComposed,
  };

  let blogIndexHtml = interpolate(layout, blogIndexVars);
  blogIndexHtml = interpolate(blogIndexHtml, blogIndexVars);
  blogIndexHtml = replaceAssetPaths(blogIndexHtml, cssFilename, jsMap);

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
      canonicalUrl: `${CONFIG.siteUrl}/blog/${post.slug}`,
      robotsMeta: '',
      criticalCss: criticalCss,
      referrerPolicy: DEFAULT_REFERRER_POLICY,
      securityMeta: '',
      consentBanner: COOKIE_BANNER_HTML,
      consentScript: CONSENT_SCRIPT_HTML,
      postTitle: escapeHTML(post.title),
      postCategory: escapeHTML(post.category),
      postDateRaw: escapeHTML(post.date),
      postDateLong: escapeHTML(post.dateLong),
      postReadingTime: escapeHTML(post.readingTimeLabel),
      postDescription: escapeHTML(post.description),
      postContent: post.content,
      postFooter: renderRelatedPosts(post, posts),
      content: postComposed,
    };

    let postHtml = interpolate(layout, postVars);
    postHtml = interpolate(postHtml, postVars);
    postHtml = replaceAssetPaths(postHtml, cssFilename, jsMap);

    const postDir = path.join(blogDir, post.slug);
    fs.mkdirSync(postDir, { recursive: true });
    fs.writeFileSync(path.join(postDir, 'index.html'), postHtml, 'utf8');
    console.log(`  built: blog/${post.slug}/index.html`);
  }

  // RSS feed
  fs.writeFileSync(path.join(blogDir, 'feed.xml'), generateRSS(posts), 'utf8');
  console.log('  built: blog/feed.xml');

  // CNAME for GitHub Pages custom domain
  fs.writeFileSync(path.join(DIST, 'CNAME'), `${getSiteHost(CONFIG.siteUrl)}\n`, 'utf8');
  console.log('  built: CNAME');

  // 404.html
  const notFoundRoute = { layout: 'default', pageClass: 'content-page' };
  const notFoundRaw = resolvePartials(fs.readFileSync(path.join(SRC, 'pages', '404.html'), 'utf8'));
  const notFoundComposed = composePage(notFoundRoute, notFoundRaw, navPartial, footerPartial, jsMap);
  const notFoundVars = {
    ...CONFIG,
    pageTitle: `Page Not Found — ${CONFIG.appName}`,
    pageDescription: `The page you are looking for does not exist.`,
    canonicalUrl: CONFIG.siteUrl,
    robotsMeta: '<meta name="robots" content="noindex">\n  ',
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
