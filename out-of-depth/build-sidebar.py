#!/usr/bin/env python3
"""
build-sidebar.py
Stamps the canonical sidebar into every HTML page in the site.

Run this whenever you change the sidebar navigation:
    python3 build-sidebar.py

What it does per file:
  1. Reads assets/partials/sidebar.html as the canonical template
  2. Determines which nav section is active from the file path
  3. Replaces the existing sidebar element with the canonical HTML,
     adding is-active to the correct nav-link
  4. For episode pages (podcast/*/episode-*/index.html), inserts a
     <link> to assets/css/base.css if not already present — base.css
     provides the sidebar CSS so it doesn't have to be inlined per file
"""

import os
import re

ROOT = os.path.dirname(os.path.abspath(__file__))
PARTIAL = os.path.join(ROOT, 'assets', 'partials', 'sidebar.html')

# Sections in nav order: (href, display label, key used for active detection)
NAV_LINKS = [
    ('/',          'Home',    'home'),
    ('/blog/',     'Blog',    'blog'),
    ('/fiction/',  'Fiction', 'fiction'),
    ('/podcast/',  'Podcast', 'podcast'),
    ('/games/',    'Games',   'games'),
    ('/about/',    'About',   'about'),
]


def active_section(filepath):
    """Determine which nav section is active from a file path."""
    rel = os.path.relpath(filepath, ROOT).replace('\\', '/')
    if rel.startswith('blog/'):     return 'blog'
    if rel.startswith('podcast/'):  return 'podcast'
    if rel.startswith('fiction/'):  return 'fiction'
    if rel.startswith('games/'):    return 'games'
    if rel.startswith('about/'):    return 'about'
    return 'home'


def build_sidebar_html(active):
    """Build the sidebar HTML with is-active on the correct link."""
    items = []
    for href, label, key in NAV_LINKS:
        cls = 'nav-link is-active' if key == active else 'nav-link'
        items.append(f'    <a class="{cls}" href="{href}">{label}</a>')
    nav_items = '\n'.join(items)
    return (
        '<aside class="sidebar" aria-label="Primary navigation">\n'
        '  <a class="brand-text" href="/">out of depth</a>\n'
        '  <nav class="nav">\n'
        f'{nav_items}\n'
        '    <hr>\n'
        '  </nav>\n'
        '</aside>'
    )


def replace_sidebar(content, active):
    """Replace the sidebar element (nav or aside with class sidebar) in HTML."""
    sidebar_html = build_sidebar_html(active)

    # Match <nav class="sidebar"...>...</nav> or <aside class="sidebar"...>...</aside>
    # Uses a non-greedy match across the whole sidebar block
    pattern = re.compile(
        r'<(?:nav|aside)[^>]*class="sidebar"[^>]*>.*?</(?:nav|aside)>',
        re.DOTALL
    )

    if pattern.search(content):
        return pattern.sub(sidebar_html, content)
    else:
        print(f'  WARNING: no sidebar element found')
        return content


def is_episode_page(filepath):
    """True for podcast/[slug]/episode-N/index.html files."""
    rel = os.path.relpath(filepath, ROOT).replace('\\', '/')
    return bool(re.match(r'podcast/[^/]+/episode-\d+/index\.html', rel))


def ensure_base_css_linked(content, filepath):
    """
    For episode pages: insert <link rel="stylesheet" href="../../assets/css/base.css">
    before the first <style> block if not already present.
    """
    if 'assets/css/base.css' in content:
        return content  # already linked

    link_tag = '<link rel="stylesheet" href="../../assets/css/base.css">\n'

    # Insert before the first <style> tag
    style_pos = content.find('<style>')
    if style_pos == -1:
        # Fall back: insert before </head>
        content = content.replace('</head>', link_tag + '</head>', 1)
    else:
        content = content[:style_pos] + link_tag + content[style_pos:]

    return content


def process_file(filepath):
    with open(filepath, encoding='utf-8') as f:
        original = f.read()

    active = active_section(filepath)
    content = replace_sidebar(original, active)

    if is_episode_page(filepath):
        content = ensure_base_css_linked(content, filepath)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False


def main():
    # Collect all HTML files, skipping the sidebar partial itself and old flat files
    skip_patterns = [
        'assets/partials/',
        'podcast/hackway-heights/hackway-heights-ep1.html',
        'podcast/analysis-complete/analysis-complete-ep1.html',
        'podcast/sunbeams/sunbeams-ep1.html',
        'podcast/fifty-cent-souls/fifty-cent-souls-ep1.html',
        'podcast/sapphire-doom/sapphire-doom-ep1.html',
        'blog/post-slug/index.html',   # blank scaffold, no sidebar
        'post-template.html',          # blank scaffold
    ]

    updated = []
    skipped = []

    for dirpath, dirnames, filenames in os.walk(ROOT):
        # Skip hidden dirs and node_modules etc.
        dirnames[:] = [d for d in dirnames if not d.startswith('.')]
        for filename in filenames:
            if not filename.endswith('.html'):
                continue
            filepath = os.path.join(dirpath, filename)
            rel = os.path.relpath(filepath, ROOT).replace('\\', '/')

            if any(rel.endswith(skip) or rel.startswith(skip) for skip in skip_patterns):
                skipped.append(rel)
                continue

            changed = process_file(filepath)
            if changed:
                updated.append(rel)

    print(f'Updated {len(updated)} files:')
    for f in sorted(updated):
        print(f'  {f}')
    if skipped:
        print(f'\nSkipped {len(skipped)} scaffolds/partials:')
        for f in sorted(skipped):
            print(f'  {f}')


if __name__ == '__main__':
    main()
