import path from 'node:path';
import { createRequire } from 'node:module';
import { siteConfig } from './site.mjs';

const BLOG_SRC = path.join(process.cwd(), 'src', 'blog');
const require = createRequire(import.meta.url);
const sharedBlog = require('../../lib/shared/blog.js');
const {
  generateRSS: buildRSS,
  loadBlogPosts: loadPosts,
} = sharedBlog;

export function loadBlogPosts() {
  return loadPosts(BLOG_SRC);
}

export function generateRSS(posts) {
  return buildRSS(posts, siteConfig);
}
