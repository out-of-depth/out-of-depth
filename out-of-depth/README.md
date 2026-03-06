# Out of Depth — Site Documentation

## Stack
- Static HTML / CSS / JS
- Hosted on Vercel (auto-deploys on git push)
- No CMS, no build step, no framework

---

## Folder Structure

```
outofdepth.com/
│
├── index.html                      ← home page
│
├── blog/
│   ├── index.html                  ← blog index (FF7-style)
│   ├── post-template.html          ← copy this for every new post
│   └── post-slug/
│       └── index.html              ← individual post
│
├── fiction/
│   └── index.html
│
├── podcast/
│   └── index.html
│
├── games/
│   └── index.html
│
├── about/
│   └── index.html
│
└── assets/
    ├── css/
    │   ├── base.css                ← variables, reset, fonts, sidebar, nav
    │   ├── components.css          ← box panels, amiga buttons, file icons
    │   └── blog-post.css           ← post window, header, body, blockquote
    ├── js/
    │   └── posts.js                ← shared filtering / navigation (TODO)
    ├── fonts/                      ← all font files live here
    │   ├── AtkinsonHyperlegible-Regular.ttf
    │   ├── AtkinsonHyperlegible-Bold.ttf
    │   ├── AtkinsonHyperlegible-Italic.ttf
    │   ├── AtkinsonHyperlegible-BoldItalic.ttf
    │   ├── Jersey15-Regular.ttf
    │   ├── Jersey25-Regular.ttf
    │   ├── Exo-Light.woff2         ← download from gwfh.mranftl.com/fonts/exo
    │   ├── Exo-Regular.woff2
    │   └── SymphonyoftheNightfont.ttf  ← reserved for easter eggs/dialogue only
    ├── images/
    │   └── podcast/
    │       ├── sunbeams.jpg
    │       ├── fifty-cent-souls.jpg
    │       ├── sapphire-doom.jpg
    │       ├── hackway-heights.jpg
    │       └── analysis-complete.jpg
    └── data/
        └── posts.json              ← content index — update when publishing
```

---

## CSS Conventions

All pages link three stylesheets in this order:

```html
<link rel="stylesheet" href="/assets/css/base.css">
<link rel="stylesheet" href="/assets/css/components.css">
<link rel="stylesheet" href="/assets/css/blog-post.css">  <!-- blog posts only -->
```

The `../` depth of the path depends on where the HTML file sits:
- Root pages (index.html): `/assets/css/base.css`
- One level deep (blog/index.html): `../assets/css/base.css`
- Two levels deep (blog/post-slug/index.html): `../../assets/css/base.css`

---

## Color Palette

| Name        | Value                    | Use                              |
|-------------|--------------------------|----------------------------------|
| --magenta   | #ff03ff                  | Headings, borders, active states |
| --cyan      | #00e5ff                  | Podcast, random elements         |
| --teal      | #005c63                  | Background gradients             |
| --blue-mid  | #054278                  | Secondary borders, nav           |
| --bg        | #000                     | Page background                  |

---

## Typography

| Font                  | Use                                          |
|-----------------------|----------------------------------------------|
| Exo (Light 300)       | Brand name "out of depth" in sidebar only    |
| Jersey25              | Post titles, section headings, signatures    |
| Jersey15              | UI labels, nav, metadata, bylines            |
| AtkinsonHyperlegible  | All body text                                |
| SymphonyOfTheNight    | Easter eggs and dialogue boxes ONLY — keep rare |

---

## Publishing a New Blog Post

1. Duplicate `blog/post-template.html`
2. Move it to `blog/your-post-slug/index.html`
3. Replace all placeholder text (marked in CAPS)
4. Add an entry to `assets/data/posts.json`
5. Add the slug to the `allPosts` array in the post's `<script>` block
6. Update PREV/NEXT links on the adjacent posts
7. Git push — Vercel deploys automatically

---

## posts.json

Single source of truth for all content. Powers:
- Home page featured item and recent grid
- Blog index filtering
- Discovery footer random post pool
- Podcast episode list and season filtering

Update it every time you publish anything.

---

## Fonts Note

Exo (used for the brand name) must be self-hosted.
Download WOFF2 files from: https://gwfh.mranftl.com/fonts/exo
Select weights 300 and 400, download, drop into assets/fonts/

---

## Reserved Design Patterns

- **SymphonyOfTheNight font** — do not use in structural UI. Only for
  dialogue boxes (blockquote variant), easter eggs, hidden content.
- **Magenta (#ff03ff)** — primary accent, used freely
- **Cyan (#00e5ff)** — secondary accent, used for podcast and wildcard/random elements
- **Green (rgba(0,255,128))** — reserved for Games section
