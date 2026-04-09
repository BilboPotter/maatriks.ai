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
  { page: 'privacy.html', out: 'privacy/index.html', canonical: '/privacy', layout: 'default', pageClass: 'content-page', title: `Privacy Policy — ${CONFIG.companyName}`, description: `Privacy policy for ${CONFIG.appName} by ${CONFIG.companyName}.` },
  { page: 'support.html', out: 'support/index.html', canonical: '/support', layout: 'default', pageClass: 'content-page', title: `Support — ${CONFIG.companyName}`, description: `Get help with ${CONFIG.appName}. Contact ${CONFIG.supportEmail}.` },
  { page: 'delete-account.html', out: 'delete-account/index.html', canonical: '/delete-account', layout: 'default', pageClass: 'content-page', title: `Delete Account — ${CONFIG.companyName}`, description: `How to delete your ${CONFIG.appName} account and what happens to your data.` },
  { page: 'forgot-password.html', out: 'forgot-password/index.html', canonical: '/forgot-password', layout: 'default', pageClass: 'content-page', title: `Reset Password — ${CONFIG.appName}`, description: `How to reset your ${CONFIG.appName} password.` },
  { page: 'auth-callback.html', out: 'auth/callback/index.html', canonical: '/auth/callback', layout: 'auth', title: `Redirecting — ${CONFIG.appName}`, description: `Authentication redirect for ${CONFIG.appName}.` },
  { page: 'update-password.html', out: 'update-password/index.html', canonical: '/update-password', layout: 'auth', title: `Update Password — ${CONFIG.appName}`, description: `Password recovery redirect for ${CONFIG.appName}.` },
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
    if (!file.endsWith('.html')) continue;
    const post = parseBlogPost(path.join(BLOG_SRC, file));
    if (post) posts.push(post);
  }

  // Sort newest first
  posts.sort((a, b) => b.date.localeCompare(a.date));
  return posts;
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
    <description>Writing from ${CONFIG.companyName}</description>
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
  html = html.replace('/styles/main.css', `/styles/${cssFilename}`);
  for (const [orig, hashed] of Object.entries(jsMap)) {
    html = html.replace(`/scripts/${orig}`, `/scripts/${hashed}`);
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
    const vars = {
      ...CONFIG,
      pageTitle: route.title,
      pageDescription: route.description,
      canonicalUrl: canonicalUrl,
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

  // Copy root favicon for backwards compatibility
  const faviconPath = path.join(ASSETS, 'favicon.svg');
  if (fs.existsSync(faviconPath)) {
    fs.writeFileSync(path.join(DIST, 'favicon.svg'), fs.readFileSync(faviconPath, 'utf8'), 'utf8');
    console.log('  built: favicon.svg');
  }

  // Blog
  const blogRoute = { layout: 'default', pageClass: 'content-page' };
  const posts = loadBlogPosts();
  if (posts.length > 0) {
    const blogIndexTemplate = resolvePartials(fs.readFileSync(path.join(SRC, 'pages', 'blog-index.html'), 'utf8'));
    const blogPostTemplate = resolvePartials(fs.readFileSync(path.join(SRC, 'pages', 'blog-post.html'), 'utf8'));

    // Build blog index
    const blogListHtml = posts.map(post =>
      `<article class="card" style="margin-bottom:16px;">
        <h2 style="margin-top:0;"><a href="/blog/${post.slug}">${post.title}</a></h2>
        <p class="page-meta" style="margin-bottom:8px;">${post.date}</p>
        <p>${post.description}</p>
      </article>`
    ).join('\n');

    const blogIndexComposed = composePage(blogRoute, blogIndexTemplate, navPartial, footerPartial, jsMap);
    const blogIndexVars = {
      ...CONFIG,
      pageTitle: `Blog — ${CONFIG.companyName}`,
      pageDescription: `Writing from ${CONFIG.companyName} on training, programming, and building the app.`,
      canonicalUrl: `${CONFIG.siteUrl}/blog`,
      blogList: blogListHtml,
      content: blogIndexComposed,
    };

    let blogIndexHtml = interpolate(layout, blogIndexVars);
    blogIndexHtml = interpolate(blogIndexHtml, blogIndexVars);
    blogIndexHtml = replaceAssetPaths(blogIndexHtml, cssFilename, jsMap);

    const blogDir = path.join(DIST, 'blog');
    fs.mkdirSync(blogDir, { recursive: true });
    fs.writeFileSync(path.join(blogDir, 'index.html'), blogIndexHtml, 'utf8');
    console.log('  built: blog/index.html');

    // Build individual posts
    for (const post of posts) {
      const postComposed = composePage(blogRoute, blogPostTemplate, navPartial, footerPartial, jsMap);
      const postVars = {
        ...CONFIG,
        pageTitle: `${post.title} — ${CONFIG.companyName}`,
        pageDescription: post.description,
        canonicalUrl: `${CONFIG.siteUrl}/blog/${post.slug}`,
        postTitle: post.title,
        postDate: post.date,
        postContent: post.content,
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
  }

  // CNAME for GitHub Pages custom domain
  fs.writeFileSync(path.join(DIST, 'CNAME'), `${getSiteHost(CONFIG.siteUrl)}\n`, 'utf8');
  console.log('  built: CNAME');

  // 404.html
  const notFoundRoute = { layout: 'default', pageClass: 'content-page' };
  const notFoundRaw = resolvePartials(fs.readFileSync(path.join(SRC, 'pages', '404.html'), 'utf8'));
  const notFoundComposed = composePage(notFoundRoute, notFoundRaw, navPartial, footerPartial, jsMap);
  const notFoundVars = {
    ...CONFIG,
    pageTitle: `Page Not Found — ${CONFIG.companyName}`,
    pageDescription: `The page you are looking for does not exist.`,
    canonicalUrl: CONFIG.siteUrl,
    content: notFoundComposed,
  };
  let notFoundHtml = interpolate(layout, notFoundVars);
  notFoundHtml = interpolate(notFoundHtml, notFoundVars);
  notFoundHtml = replaceAssetPaths(notFoundHtml, cssFilename, jsMap);
  fs.writeFileSync(path.join(DIST, '404.html'), notFoundHtml, 'utf8');
  console.log('  built: 404.html');

  // .nojekyll to disable Jekyll processing
  fs.writeFileSync(path.join(DIST, '.nojekyll'), '', 'utf8');
  console.log('  built: .nojekyll');

  console.log('\nDone. Output in dist/');
}

build();
