# Out of Depth — Claude Code Project Brief

## What this project is
A personal website called **Out of Depth** (outofdepth.com) belonging to Jae. It is a fully static site — HTML, CSS, and JS only. No frameworks, no CMS. Hosted on Vercel, connected to this GitHub repository.

There is one build script: `build-sidebar.py`. Run it with `python3 build-sidebar.py` whenever the sidebar navigation changes. It stamps the canonical sidebar from `assets/partials/sidebar.html` into every page and sets the correct `is-active` class automatically.

---

## File structure
```
/
├── index.html                          ← home page (not yet built)
├── blog/
│   ├── index.html                      ← blog index (not yet built)
│   ├── post-template.html              ← REFERENCE — copy this for every new post
│   └── post-slug/
│       └── index.html
├── fiction/
│   └── index.html                      ← not yet built
├── podcast/
│   └── index.html                      ← not yet built
├── games/
│   └── index.html                      ← not yet built
├── about/
│   └── index.html                      ← not yet built
├── build-sidebar.py                    ← run this when nav changes; stamps sidebar into all pages
└── assets/
    ├── css/
    │   ├── base.css                    ← variables, reset, fonts, sidebar, nav, animations
    │   ├── components.css              ← box panels, amiga buttons, win3.1 file icons, discovery footer
    │   └── blog-post.css              ← post window, header, body, blockquote, signature
    ├── partials/
    │   └── sidebar.html               ← canonical sidebar — edit only this, then run build-sidebar.py
    ├── js/
    ├── fonts/                          ← all font files live here, already in place
    ├── images/
    │   └── podcast/                    ← season cover art goes here
    └── data/
        └── posts.json                  ← content index — update every time you add a post
```

---

## CSS architecture

Every page links these stylesheets. Path depth depends on folder level:

```html
<!-- Root pages (index.html) -->
<link rel="stylesheet" href="assets/css/base.css">
<link rel="stylesheet" href="assets/css/components.css">

<!-- One level deep (blog/index.html) -->
<link rel="stylesheet" href="../assets/css/base.css">
<link rel="stylesheet" href="../assets/css/components.css">

<!-- Two levels deep (blog/post-slug/index.html) -->
<link rel="stylesheet" href="../../assets/css/base.css">
<link rel="stylesheet" href="../../assets/css/components.css">
<link rel="stylesheet" href="../../assets/css/blog-post.css">
```

TTRPG/homebrew posts also include inline styles for stat blocks (see Mothership post as reference). These should eventually be extracted to `assets/css/ttrpg.css`.

---

## Design system

### Colors
```css
--magenta:    #ff03ff    /* primary accent — headings, borders, active states */
--cyan:       #00e5ff    /* secondary — podcast, random/wildcard elements */
--teal:       #005c63    /* background gradients */
--blue-mid:   #054278    /* secondary borders, nav */
--bg:         #000       /* page background */
--lemon:      #f5c71a    /* flavor text in stat blocks, in-universe ad copy */
```

### Fonts
| Font | Use |
|------|-----|
| Exo (400) | Brand name "out of depth" in sidebar ONLY |
| Jersey25 | Post titles, section headings, signatures, stat values |
| Jersey15 | UI labels, nav links, metadata, bylines, stat labels |
| AtkinsonHyperlegible | All body text |
| SymphonyOfTheNight | Easter eggs and dialogue boxes ONLY — keep rare, never use in structural UI |

### Key design rules
- Black background throughout — no light backgrounds
- Avoid light gray text on dark backgrounds — use at minimum `rgba(255,255,255,0.83)` for body text
- Magenta is used freely for headings and accents
- Cyan is reserved for podcast content and random/wildcard UI elements
- The sidebar is always present and identical on every page — only the `is-active` class changes per page

---

## Sidebar

The canonical sidebar lives in `assets/partials/sidebar.html`. **Never edit the sidebar directly in individual page files.** Instead:

1. Edit `assets/partials/sidebar.html`
2. Run `python3 build-sidebar.py`

The script stamps the sidebar into every page and sets `is-active` on the correct link based on each file's path. It also ensures all episode pages link `base.css` (which provides the sidebar CSS).

The sidebar structure (for reference — edit the partial, not this):
```html
<aside class="sidebar" aria-label="Primary navigation">
  <a class="brand-text" href="/">out of depth</a>
  <nav class="nav">
    <a class="nav-link" href="/">Home</a>
    <a class="nav-link" href="/blog/">Blog</a>
    <a class="nav-link" href="/fiction/">Fiction</a>
    <a class="nav-link" href="/podcast/">Podcast</a>
    <a class="nav-link" href="/games/">Games</a>
    <a class="nav-link" href="/about/">About</a>
    <hr>
  </nav>
</aside>
```

CSS for the sidebar lives in `base.css` (`.sidebar`, `.brand-text`, `.nav-link`, `.nav-link.is-active`).

---

## Blog post structure

Every blog post lives at `blog/post-slug/index.html`. Use `blog/post-template.html` as the base. Key things to fill in per post:

- `<title>`, `og:title`, `og:description`, `og:url`
- JSON-LD: `headline`, `datePublished`, `description`, `url`
- `u-url` and `u-uid` hidden link (IndieWeb microformat)
- `p-summary` hidden paragraph (IndieWeb microformat)
- `p-category` — the post category
- `p-name` on the `<h1>` — post title (also set `data-text` attribute to same value for chromatic aberration effect)
- `dt-published` — datetime attribute in `YYYY-MM-DD` format, display text as `Month DD, YYYY`
- PREV/NEXT slugs in the title bar nav buttons
- Post body inside `<div class="post-body e-content">`
- Discovery footer: two related post file icons + random post button
- `allPosts` array in the script block — add every published slug here

### IndieWeb / microformat checklist per post
- `h-entry` on `<article>` ✓ (already in template)
- `u-url` + `u-uid` hidden `<a>` in header ✓
- `p-summary` hidden `<p>` in header ✓
- `p-category` on category div ✓
- `p-name` on `<h1>` ✓
- `p-author h-card` wrapping author name with `p-name u-url` on the link ✓
- `dt-published` on `<time>` ✓
- `e-content` on post body div ✓

---

## posts.json schema

Update this file every time a post is published. It drives the home page, blog index filtering, and discovery footer random pool.

```json
{
  "posts": [
    {
      "slug":     "post-slug-here",
      "title":    "Post Title Here",
      "type":     "blog",
      "category": "TTRPGs",
      "excerpt":  "One sentence description.",
      "date":     "YYYY-MM-DD",
      "author":   "Jae",
      "readTime": 8,
      "path":     "/blog/post-slug-here/",
      "featured": false
    }
  ]
}
```

---

## TTRPG stat block pattern

Used in homebrew/game content posts. Flavor text in `#f5c71a` (lemon), small and italic. Stats displayed as label-above / big Jersey25 value below. Green `#7fff7f` for positive values, red `#ff7f7f` for negatives. Bug row gets red tint treatment.

Reference implementation: `blog/5-mothership-android-variants/index.html`

Eventually extract stat block CSS to `assets/css/ttrpg.css`.

---

## Old website

The old site lives at `https://www.getoutofdepth.com`. Content can be fetched from there for porting. Jae is migrating posts across manually, deciding what to keep. Do not auto-port everything — wait for instruction on which posts to bring over.

The old site uses Squarespace. Images from the old site are hosted on Squarespace CDN and should not be hotlinked. If a post references images, flag it for Jae to provide new assets.

---

## Pages still to build
- `index.html` — home page (build last, after content is in place)
- `blog/index.html` — FF7-style post index with filtering
- `podcast/index.html` — episode list, custom audio player, season grid
- `fiction/index.html` — unique design, different feel from blog
- `games/index.html`
- `about/index.html`

---

## What Claude Code should and should not do

**Do:**
- Port blog posts when instructed, using `blog/post-template.html` as the base
- Update `posts.json` whenever a post is added
- Keep the `allPosts` array in each post's script block in sync
- Maintain consistent sidebar HTML across all pages
- Follow the CSS path depth rules carefully

**Do not:**
- Change the color palette
- Use SymphonyOfTheNight font in structural UI
- Use light gray text on dark backgrounds
- Auto-port all old blog posts without instruction
- Hotlink images from the old Squarespace CDN
- Introduce any frameworks, build tools, or package dependencies

---

## Content integrity — CRITICAL

When porting content from the old site, reproduce Jae's words **verbatim**. This means:

- Do not fix typos
- Do not change punctuation — if the original uses "--" do not change it to "—"
- Do not rewrite sentences for clarity
- Do not add, remove, or rephrase anything
- Do not "clean up" grammar or style

If the original says "wench" and it should be "winch", leave it as "wench". Jae's voice is Jae's voice.

The only changes permitted when porting are structural — wrapping content in the correct HTML elements. The words themselves are untouchable unless Jae explicitly asks for a change.

This rule applies to Claude Code AND to this chat session.
