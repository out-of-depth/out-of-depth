/**
 * webmentions.js — fetches and renders webmention.io mentions for a post
 *
 * - Reads the post's canonical URL from the .u-url.u-uid link already in
 *   the page (same value used for IndieWeb markup) — never reconstructed
 * - Fetches mentions.jf2 from webmention.io, cached in sessionStorage per
 *   URL for the tab session (same pattern as blog-post.js's posts cache)
 * - Renders each entry into #mentions-body, styled by wm-property: replies
 *   and reposts get a full row (author, source, text), likes collapse to
 *   icon + author + source only
 * - Fails silently on any error (network, bad response, zero mentions
 *   still renders the empty-state line) — never shows a broken state
 *
 * TOKEN: the string below is a placeholder — swap in the real
 * webmention.io token before this can authenticate. It's meant to live in
 * client-side source: webmention.io scopes tokens to read-only access
 * against your own account's mentions, so it can't write, delete, or
 * modify anything. This is intentional, not a leaked secret.
 */
(function () {
  'use strict';

  var TOKEN = 'REPLACE-WITH-WEBMENTION-TOKEN';

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function hostFromUrl(url) {
    try { return new URL(url).hostname.replace(/^www\./, ''); }
    catch (e) { return url; }
  }

  function truncate(str, n) {
    return str.length > n ? str.slice(0, n - 1) + '…' : str;
  }

  function propMeta(prop) {
    switch (prop) {
      case 'in-reply-to': return { icon: '↩', tag: 'replied' };
      case 'repost-of':   return { icon: '↺', tag: 'reposted' };
      case 'like-of':     return { icon: '♥', tag: 'liked this' };
      default:            return { icon: '→', tag: 'mentioned' };
    }
  }

  function renderRow(entry) {
    var prop   = entry['wm-property'];
    var meta   = propMeta(prop);
    var isLike = prop === 'like-of';

    var author     = entry.author || {};
    var authorName = escapeHtml(author.name || 'someone');
    var sourceUrl  = entry.url || entry['wm-source'] || '#';
    var sourceHost = escapeHtml(hostFromUrl(sourceUrl));

    var textHtml = '';
    if (!isLike) {
      var content = (entry.content && (entry.content.text || entry.content.value)) || '';
      if (content) {
        textHtml = '<div class="mention-text">' + escapeHtml(truncate(content, 280)) + '</div>';
      }
    }

    return (
      '<div class="mention-row' + (isLike ? ' is-like' : '') + '">' +
        '<div class="mention-icon">' + meta.icon + '</div>' +
        '<div class="mention-content">' +
          '<div class="mention-meta">' +
            '<span class="mention-author">' + authorName + '</span>' +
            '<span class="mention-type-tag">' + meta.tag + '</span>' +
            '<span class="mention-source"><a href="' + escapeHtml(sourceUrl) + '" rel="nofollow">' + sourceHost + '</a></span>' +
          '</div>' +
          textHtml +
        '</div>' +
      '</div>'
    );
  }

  function render(body, entries) {
    if (!entries.length) {
      body.innerHTML = '<div class="mentions-empty">no mentions yet &mdash; be the first to link here</div>';
      return;
    }
    body.innerHTML = entries.map(renderRow).join('');
  }

  function getMentions(url, cb) {
    var cacheKey = 'ood_wm_' + url;

    try {
      var cached = sessionStorage.getItem(cacheKey);
      if (cached) { cb(JSON.parse(cached)); return; }
    } catch (e) {}

    var endpoint =
      'https://webmention.io/api/mentions.jf2?target=' + encodeURIComponent(url) +
      '&token=' + encodeURIComponent(TOKEN);

    fetch(endpoint)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var entries = (data && data.children) || [];
        try { sessionStorage.setItem(cacheKey, JSON.stringify(entries)); } catch (e) {}
        cb(entries);
      })
      .catch(function () {});   // silently fail — panel keeps its default empty markup
  }

  function init() {
    var body = document.getElementById('mentions-body');
    if (!body) return;

    var canonicalEl = document.querySelector('.u-url.u-uid');
    if (!canonicalEl) return;

    getMentions(canonicalEl.href, function (entries) {
      render(body, entries);
    });
  }

  document.addEventListener('DOMContentLoaded', init);

}());
