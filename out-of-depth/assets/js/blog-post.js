/**
 * blog-post.js — shared logic for every blog post page
 *
 * - Reads posts.json once (cached in sessionStorage for the tab session)
 * - Populates #post-nav with PREV / NEXT buttons based on chronological order
 * - Powers the "Take me somewhere" random post button in the discovery footer
 *
 * To add a new post: update posts.json only.
 * Set "live": true when the HTML page is published.
 */
(function () {
  'use strict';

  var CACHE_KEY = 'ood_posts_json';

  function getPosts(cb) {
    try {
      var cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) { cb(JSON.parse(cached)); return; }
    } catch (e) {}

    fetch('/assets/data/posts.json')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch (e) {}
        cb(data);
      })
      .catch(function () {});   // silently fail — static disabled placeholders remain
  }

  // Normalise a path so trailing-slash differences don't cause mismatches
  function normPath(p) {
    return p.replace(/\/?$/, '/');
  }

  function liveBlogPosts(data) {
    return (data.posts || [])
      .filter(function (p) { return p.type === 'blog' && p.live; })
      .sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
  }

  // ── PREV / NEXT ────────────────────────────────────────────────────────

  function initPrevNext() {
    var nav = document.getElementById('post-nav');
    if (!nav) return;

    var current = normPath(window.location.pathname);

    getPosts(function (data) {
      var posts = liveBlogPosts(data);
      var idx   = -1;
      posts.forEach(function (p, i) { if (normPath(p.path) === current) idx = i; });
      if (idx === -1) return;

      var prev = idx > 0              ? posts[idx - 1] : null;
      var next = idx < posts.length - 1 ? posts[idx + 1] : null;

      nav.innerHTML =
        (prev
          ? '<a class="amiga-btn" href="' + prev.path + '" title="Previous post">&#9668; PREV</a>'
          : '<span class="amiga-btn disabled" aria-disabled="true">&#9668; PREV</span>') +
        (next
          ? '<a class="amiga-btn" href="' + next.path + '" title="Next post">NEXT &#9658;</a>'
          : '<span class="amiga-btn disabled" aria-disabled="true">NEXT &#9658;</span>');
    });
  }

  // ── RANDOM POST ────────────────────────────────────────────────────────

  function initRandom() {
    var btn = document.querySelector('.file-icon.random');
    if (!btn) return;

    var current = normPath(window.location.pathname);

    btn.addEventListener('click', function () {
      var glyph = btn.querySelector('.file-glyph');
      var name  = btn.querySelector('.file-name');

      getPosts(function (data) {
        var others = liveBlogPosts(data)
          .map(function (p) { return p.path; })
          .filter(function (path) { return normPath(path) !== current; });

        if (!others.length) return;

        if (glyph) glyph.textContent = '...';
        if (name)  name.textContent  = 'searching';

        setTimeout(function () {
          window.location.href = others[Math.floor(Math.random() * others.length)];
        }, 450);
      });
    });
  }

  // ── Init ───────────────────────────────────────────────────────────────

  document.addEventListener('DOMContentLoaded', function () {
    initPrevNext();
    initRandom();
  });

}());
