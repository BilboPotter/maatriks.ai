const fs = require('node:fs');
const path = require('node:path');

function parseBlogPost(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const metaMatch = raw.match(/<!--meta\s*([\s\S]*?)-->/);
  if (!metaMatch) {
    return null;
  }

  const meta = JSON.parse(metaMatch[1]);
  const content = raw.slice(metaMatch[0].length).trim();
  return { ...meta, content };
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
  if (!plainText) {
    return 3;
  }

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

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeXML(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderTopicPills(posts) {
  const categories = [...new Set(posts.map((post) => post.category))];
  return categories
    .map((category) => `<span class="blog-topic-pill">${escapeHTML(category)}</span>`)
    .join('\n');
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

  return posts.map((post) => (
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
  const related = posts.filter((post) => post.slug !== currentPost.slug).slice(0, 3);

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
        ${related.map((post) => `
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

function loadBlogPosts(blogSrcDir) {
  if (!fs.existsSync(blogSrcDir)) {
    return [];
  }

  const posts = [];
  for (const file of fs.readdirSync(blogSrcDir)) {
    if (file.startsWith('_') || !file.endsWith('.html')) {
      continue;
    }

    const post = parseBlogPost(path.join(blogSrcDir, file));
    if (post) {
      posts.push(post);
    }
  }

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

function getBlogIndexViewModel(posts) {
  const featuredPost = posts[0] || null;
  const archivePosts = featuredPost ? posts.slice(1) : [];

  return {
    blogTopics: renderTopicPills(posts),
    featuredPost: renderBlogFeature(featuredPost),
    blogArchive: renderBlogArchive(archivePosts),
    blogPostCount: posts.length === 0
      ? 'Archive opening soon'
      : posts.length === 1
        ? '1 article live'
        : `${posts.length} articles live`,
  };
}

function getBlogPostViewModel(post, posts) {
  return {
    postTitle: escapeHTML(post.title),
    postCategory: escapeHTML(post.category),
    postDateRaw: escapeHTML(post.date),
    postDateLong: escapeHTML(post.dateLong),
    postReadingTime: escapeHTML(post.readingTimeLabel),
    postDescription: escapeHTML(post.description),
    postContent: post.content,
    postFooter: renderRelatedPosts(post, posts),
  };
}

function generateRSS(posts, siteConfig) {
  const items = posts.map((post) => {
    const url = `${siteConfig.siteUrl}/blog/${post.slug}`;
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
    <title>${siteConfig.appName} Blog</title>
    <link>${siteConfig.siteUrl}/blog</link>
    <description>Writing from ${siteConfig.appName}</description>
    <language>en</language>
    <atom:link href="${siteConfig.siteUrl}/blog/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;
}

module.exports = {
  generateRSS,
  getBlogIndexViewModel,
  getBlogPostViewModel,
  loadBlogPosts,
};
