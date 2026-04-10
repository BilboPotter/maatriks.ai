import { generateRSS, loadBlogPosts } from '../../lib/blog.mjs';

export function GET() {
  return new Response(generateRSS(loadBlogPosts()), {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  });
}
