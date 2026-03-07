# Project Context — Current State

This file captures where the project stands right now so future Claude instances can orient quickly. Read `CLAUDE.md` first for the overall site spec; this file tracks what's done, what's in progress, and what to watch out for.

---

## What has been built so far

### Podcast episode pages — COMPLETE (as of commit a11f44a)

All five podcast seasons now have full episode pages at `podcast/[season-slug]/episode-N/index.html`.

| Season | Slug | Episodes | Color | RPG System |
|--------|------|----------|-------|------------|
| Hackway Heights | `hackway-heights` | 12 | `#c8791a` | Electric Bastionland |
| Analysis Complete | `analysis-complete` | 12 | `#2a9d9d` | Mothership RPG |
| Sunbeams | `sunbeams` | 12 | `#f5924e` | Icons RPG |
| Fifty Cent Souls | `fifty-cent-souls` | 12 | `#c9a227` | Call of Cthulhu |
| Sapphire Doom | `sapphire-doom` | 6 | `#6b7fd4` | Knave 2e |

Each episode page lives at: `podcast/[slug]/episode-N/index.html`

Audio is hosted on Captivate:
- Seasons 1–4: `https://podcasts.captivate.fm/media/...`
- Season 5 (Sapphire Doom): `https://episodes.captivate.fm/episode/...`

### Episode page structure

Two CSS format variants exist. **Do not mix them up.**

**Expanded (Hackway Heights only):** Multi-line, readable CSS with CSS variables for `--magenta`, `--teal`, `--cyan`, etc. plus `--season-*` vars. Font paths use single-quotes. Nav buttons use relative paths (`../episode-N/`). JS block is multi-line.

**Minified (all other seasons):** Single-line CSS with only the five `--season-*` vars (no `--magenta` etc.). Font paths use double-quotes. Nav buttons use absolute paths (`/podcast/[slug]/episode-N/`). JS block is minified.

**Reference files:**
- Expanded format: `podcast/hackway-heights/episode-2/index.html` (canonical — do not touch)
- Minified format: `podcast/analysis-complete/episode-1/index.html`

### Old flat-file templates — still present, leave alone

These still exist and should not be deleted:
- `podcast/hackway-heights/hackway-heights-ep1.html`
- `podcast/analysis-complete/analysis-complete-ep1.html`
- `podcast/sunbeams/sunbeams-ep1.html`
- `podcast/fifty-cent-souls/fifty-cent-souls-ep1.html`
- `podcast/sapphire-doom/sapphire-doom-ep1.html`

They predate the current structure and are not linked anywhere in the new site.

### Blog posts

Some posts have been ported from the old Squarespace site. Check `assets/data/posts.json` for the current list. Use `blog/post-template.html` as the base for any new post.

---

### Sidebar — standardized (as of commit after a11f44a)

The sidebar is now managed by a build script. The canonical HTML lives in `assets/partials/sidebar.html`. To update the nav:

1. Edit `assets/partials/sidebar.html`
2. Run `python3 build-sidebar.py` from the project root

The script replaces the sidebar in all 55+ pages and sets `is-active` automatically. All episode pages now also link `base.css` (which provides sidebar CSS — `.sidebar`, `.brand-text`, `.nav-link`, `.nav-link.is-active`).

**Do not edit sidebar HTML directly in any page file** — it will be overwritten next time the script runs.

---

## Pages still to build

These are listed in `CLAUDE.md` and remain unbuilt:

- `index.html` — home page (build last)
- `blog/index.html` — FF7-style post index with filtering
- `podcast/index.html` — season grid + episode list
- `fiction/index.html`
- `games/index.html`
- `about/index.html`

---

## Current git branch

Active development branch: `claude/organize-podcast-folders-LK1NS`

The main branch should not be pushed to directly. All Claude work goes on this branch.

---

## Important gotchas

**HH ep1 and ep2 are correct — do not touch them.** They have manually verified content and are the canonical reference for the HH episode format.

**Episode descriptions are plain text** inside a `<p class="episode-description">` — no HTML tags inside. Show notes are HTML (with `<a>` links and `<hr>` dividers) inside `<div class="show-notes">`.

**Cover art paths** are always `../../assets/images/podcast/[slug].jpg` — two levels up because pages live at `podcast/[slug]/episode-N/index.html`.

**Font paths** in inline `<style>` blocks on episode pages are always `../../assets/fonts/` — same depth logic. Fonts declared in `base.css` use `../fonts/` (relative to the CSS file). Both resolve correctly.

**Episode list** on every page includes all episodes for that season (not just nearby ones), with the current episode marked `class="current"`.

**HH durations** are known for episodes 1–6 (1:18:04, 1:24:11, 1:09:38, 1:31:55, 1:15:22, 1:22:47). Episodes 7–12 have no duration shown. Other seasons show no durations.

**Content integrity rule** (from CLAUDE.md) applies everywhere — typos, punctuation, and phrasing in episode descriptions and show notes must be reproduced verbatim from the RSS source.
