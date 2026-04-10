const fs = require('node:fs');
const path = require('node:path');

function interpolate(content, vars = {}) {
  return content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return vars[key] !== undefined ? vars[key] : match;
  });
}

function findUnresolvedPlaceholders(content) {
  const matches = [
    ...content.matchAll(/\{\{\s*\w+\s*\}\}/g),
    ...content.matchAll(/\{\{>\s*[\w-]+\s*\}\}/g),
  ];

  return [...new Set(matches.map((match) => match[0]))];
}

function assertNoUnresolvedPlaceholders(content, contextLabel = 'template') {
  const unresolved = findUnresolvedPlaceholders(content);
  if (unresolved.length > 0) {
    throw new Error(`Unresolved template placeholders in ${contextLabel}: ${unresolved.join(', ')}`);
  }

  return content;
}

function resolvePartials(content, options = {}) {
  const {
    partialsDir,
    missingPartialMode = 'ignore',
    partialExtension = '.html',
  } = options;

  return content.replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (match, name) => {
    if (!partialsDir) {
      return match;
    }

    const partialPath = path.join(partialsDir, `${name}${partialExtension}`);
    if (!fs.existsSync(partialPath)) {
      if (missingPartialMode === 'throw') {
        throw new Error(`Missing partial: ${name}`);
      }

      if (missingPartialMode === 'warn') {
        console.warn(`  warning: partial not found: ${name}`);
      }
      return match;
    }

    return resolvePartials(fs.readFileSync(partialPath, 'utf8'), options);
  });
}

function loadTemplatedFile(filePath, options = {}) {
  const {
    vars = {},
    partialsDir,
    missingPartialMode = 'ignore',
    partialExtension = '.html',
    strict = false,
  } = options;

  const raw = fs.readFileSync(filePath, 'utf8');
  const interpolated = interpolate(resolvePartials(raw, {
    partialsDir,
    missingPartialMode,
    partialExtension,
  }), vars);

  return strict
    ? assertNoUnresolvedPlaceholders(interpolated, filePath)
    : interpolated;
}

function getSiteHost(siteUrl) {
  try {
    return new URL(siteUrl).host;
  } catch {
    return siteUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '');
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

module.exports = {
  assertNoUnresolvedPlaceholders,
  createHtmlAliases,
  findUnresolvedPlaceholders,
  getSiteHost,
  interpolate,
  loadTemplatedFile,
  resolvePartials,
};
