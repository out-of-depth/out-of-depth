#!/usr/bin/env python3
"""
build-feed.py
Generates the Atom feeds for the blog from assets/data/posts.json.

Run this whenever a post is published or its metadata changes:
    python3 build-feed.py

What it does:
  1. Reads assets/data/posts.json
  2. Takes every entry with type == "blog" and live == true
  3. Writes feed.xml (all posts) at the site root
  4. Writes feed-[category-slug].xml for every known category, even ones
     with zero live posts right now, so links to them never 404
Entries are summary-only (posts.json's excerpt, not the full post body),
sorted newest first, with dates in full ISO 8601.
"""

import json
import os
from datetime import datetime, timezone
from xml.sax.saxutils import escape

ROOT = os.path.dirname(os.path.abspath(__file__))
POSTS_JSON = os.path.join(ROOT, 'assets', 'data', 'posts.json')
SITE_URL = 'https://outofdepth.com'
SITE_TITLE = 'Out of Depth'

# Mirrors CAT_SLUG in assets/js/blog-index.js — keep these in sync.
CATEGORY_SLUGS = {
    'Film & TV': 'film-tv',
    'TTRPGs':    'ttrpg',
    'Life':      'life',
    'Games':     'games',
    'Reading':   'reading',
}


def load_posts():
    with open(POSTS_JSON, encoding='utf-8') as f:
        data = json.load(f)
    posts = [p for p in data.get('posts', []) if p.get('type') == 'blog' and p.get('live')]
    posts.sort(key=lambda p: p['date'], reverse=True)
    return posts


def iso8601(date_str):
    """posts.json dates are YYYY-MM-DD; Atom wants a full timestamp."""
    return date_str + 'T00:00:00Z'


def feed_updated(posts):
    if posts:
        return iso8601(posts[0]['date'])
    return datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')


def render_entry(post):
    url = SITE_URL + post['path']
    published = iso8601(post['date'])
    return (
        '  <entry>\n'
        f'    <title>{escape(post["title"])}</title>\n'
        f'    <link href="{escape(url)}" rel="alternate" type="text/html"/>\n'
        f'    <id>{escape(url)}</id>\n'
        f'    <published>{published}</published>\n'
        f'    <updated>{published}</updated>\n'
        f'    <summary type="html">{escape(post["excerpt"])}</summary>\n'
        f'    <author><name>{escape(post.get("author", "Jae"))}</name></author>\n'
        f'    <category term="{escape(post["category"])}"/>\n'
        '  </entry>\n'
    )


def render_feed(title, self_href, posts):
    self_url = SITE_URL + self_href
    entries = ''.join(render_entry(p) for p in posts)
    return (
        '<?xml version="1.0" encoding="utf-8"?>\n'
        '<feed xmlns="http://www.w3.org/2005/Atom">\n'
        f'  <title>{escape(title)}</title>\n'
        f'  <link href="{escape(self_url)}" rel="self" type="application/atom+xml"/>\n'
        f'  <link href="{escape(SITE_URL)}/" rel="alternate" type="text/html"/>\n'
        f'  <id>{escape(self_url)}</id>\n'
        f'  <updated>{feed_updated(posts)}</updated>\n'
        '  <author><name>Jae</name></author>\n'
        f'{entries}'
        '</feed>\n'
    )


def write_feed(filename, xml):
    path = os.path.join(ROOT, filename)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(xml)
    print(f'  wrote {filename}')


def main():
    posts = load_posts()
    print(f'Found {len(posts)} live blog post(s).')

    write_feed('feed.xml', render_feed(SITE_TITLE, '/feed.xml', posts))

    for category, slug in CATEGORY_SLUGS.items():
        cat_posts = [p for p in posts if p['category'] == category]
        filename = f'feed-{slug}.xml'
        title = f'{SITE_TITLE} — {category}'
        write_feed(filename, render_feed(title, f'/{filename}', cat_posts))


if __name__ == '__main__':
    main()
