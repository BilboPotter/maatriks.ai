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

const ROOT = __dirname;
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');
const CONFIG = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.config.json'), 'utf8'));

function getSiteHost(siteUrl) {
  try {
    return new URL(siteUrl).host;
  } catch {
    return siteUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '');
  }
}

// Route definitions: source page → output path
const ROUTES = [
  { page: 'index.html', out: 'index.html', title: `${CONFIG.appName} — ${CONFIG.appTagline}`, description: CONFIG.appDescription },
  { page: 'privacy.html', out: 'privacy/index.html', title: `Privacy Policy — ${CONFIG.companyName}`, description: `Privacy policy for ${CONFIG.appName} by ${CONFIG.companyName}.` },
  { page: 'support.html', out: 'support/index.html', title: `Support — ${CONFIG.companyName}`, description: `Get help with ${CONFIG.appName}. Contact ${CONFIG.supportEmail}.` },
  { page: 'delete-account.html', out: 'delete-account/index.html', title: `Delete Account — ${CONFIG.companyName}`, description: `How to delete your ${CONFIG.appName} account and what happens to your data.` },
  { page: 'forgot-password.html', out: 'forgot-password/index.html', title: `Reset Password — ${CONFIG.appName}`, description: `How to reset your ${CONFIG.appName} password.` },
  { page: 'auth-callback.html', out: 'auth/callback/index.html', title: `Redirecting — ${CONFIG.appName}`, description: `Authentication redirect for ${CONFIG.appName}.` },
  { page: 'update-password.html', out: 'update-password/index.html', title: `Update Password — ${CONFIG.appName}`, description: `Password recovery redirect for ${CONFIG.appName}.` },
];

function interpolate(html, vars) {
  return html.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return vars[key] !== undefined ? vars[key] : match;
  });
}

function build() {
  // Clean dist
  if (fs.existsSync(DIST)) {
    fs.rmSync(DIST, { recursive: true });
  }

  const layout = fs.readFileSync(path.join(SRC, 'pages', '_layout.html'), 'utf8');
  const css = fs.readFileSync(path.join(SRC, 'styles', 'main.css'), 'utf8');

  // Build each route
  for (const route of ROUTES) {
    const pageContent = fs.readFileSync(path.join(SRC, 'pages', route.page), 'utf8');

    const vars = {
      ...CONFIG,
      pageTitle: route.title,
      pageDescription: route.description,
      content: pageContent,
    };

    let html = interpolate(layout, vars);
    // Second pass for nested interpolations (content may contain config refs)
    html = interpolate(html, vars);

    const outPath = path.join(DIST, route.out);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, html, 'utf8');
    console.log(`  built: ${route.out}`);
  }

  // Copy CSS
  const stylesDir = path.join(DIST, 'styles');
  fs.mkdirSync(stylesDir, { recursive: true });
  fs.writeFileSync(path.join(stylesDir, 'main.css'), css, 'utf8');
  console.log('  built: styles/main.css');

  // Copy JS (only files that exist)
  const scriptsDir = path.join(SRC, 'scripts');
  if (fs.existsSync(scriptsDir)) {
    const distScripts = path.join(DIST, 'scripts');
    fs.mkdirSync(distScripts, { recursive: true });
    for (const file of fs.readdirSync(scriptsDir)) {
      if (file.endsWith('.js')) {
        const content = fs.readFileSync(path.join(scriptsDir, file), 'utf8');
        // Interpolate config values into JS too
        fs.writeFileSync(path.join(distScripts, file), interpolate(content, CONFIG), 'utf8');
        console.log(`  built: scripts/${file}`);
      }
    }
  }

  // CNAME for GitHub Pages custom domain
  fs.writeFileSync(path.join(DIST, 'CNAME'), `${getSiteHost(CONFIG.siteUrl)}\n`, 'utf8');
  console.log('  built: CNAME');

  // 404.html — redirect to home for GitHub Pages SPA-like behavior
  const notFoundPage = fs.readFileSync(path.join(SRC, 'pages', 'index.html'), 'utf8');
  const notFoundVars = {
    ...CONFIG,
    pageTitle: `Page Not Found — ${CONFIG.companyName}`,
    pageDescription: `The page you are looking for does not exist.`,
    content: notFoundPage,
  };
  let notFoundHtml = interpolate(layout, notFoundVars);
  notFoundHtml = interpolate(notFoundHtml, notFoundVars);
  fs.writeFileSync(path.join(DIST, '404.html'), notFoundHtml, 'utf8');
  console.log('  built: 404.html');

  // .nojekyll to disable Jekyll processing
  fs.writeFileSync(path.join(DIST, '.nojekyll'), '', 'utf8');
  console.log('  built: .nojekyll');

  console.log('\nDone. Output in dist/');
}

build();
