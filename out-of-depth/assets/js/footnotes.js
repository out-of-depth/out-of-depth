/**
 * footnotes.js — reusable footnote popover for blog posts
 *
 * - One popover + scrim, built once and appended to document.body on
 *   init (not left in the article markup) — .post-window/.window-body
 *   are overflow:hidden and (via the materialize entrance animation)
 *   a containing block for position:fixed, so anything nested inside
 *   them would get clipped instead of spilling past the post edge.
 * - Reused for every .footnote-marker on the page; clicking a second
 *   marker while one is open just repositions/repopulates it.
 * - Desktop (>768px): positioned near the clicked marker, allowed to
 *   overflow past the post window's right edge on purpose.
 * - Mobile (<=768px): fixed, centered near the top of the viewport,
 *   with a dim scrim behind it.
 */
(function () {
  'use strict';

  var MOBILE_QUERY = '(max-width: 768px)';

  var popover, popoverNum, popoverBody, closeBtn, scrim;
  var openMarker = null;

  function isMobile() {
    return window.matchMedia(MOBILE_QUERY).matches;
  }

  function build() {
    popover = document.createElement('div');
    popover.className = 'mini-window mini-window--violet footnote-popover';
    popover.id = 'footnote-popover';
    popover.hidden = true;

    var titlebar = document.createElement('div');
    titlebar.className = 'mini-window-titlebar';

    var titleText = document.createElement('span');
    titleText.className = 'mini-window-title-text';
    titleText.textContent = 'footnote // ';

    popoverNum = document.createElement('span');
    popoverNum.id = 'footnote-popover-num';
    titleText.appendChild(popoverNum);

    closeBtn = document.createElement('button');
    closeBtn.className = 'footnote-close';
    closeBtn.setAttribute('aria-label', 'Close footnote');
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', close);

    titlebar.appendChild(titleText);
    titlebar.appendChild(closeBtn);

    popoverBody = document.createElement('div');
    popoverBody.className = 'mini-window-body';
    popoverBody.id = 'footnote-popover-body';

    popover.appendChild(titlebar);
    popover.appendChild(popoverBody);

    scrim = document.createElement('div');
    scrim.className = 'footnote-scrim';
    scrim.id = 'footnote-scrim';
    scrim.hidden = true;
    scrim.addEventListener('click', close);

    document.body.appendChild(popover);
    document.body.appendChild(scrim);
  }

  function position(marker) {
    if (isMobile()) return; // fixed centered position, no per-marker math

    var rect = marker.getBoundingClientRect();
    // popover is a child of document.body (unpositioned), so its
    // containing block is the document, not the viewport — convert
    // the viewport-relative rect to document coordinates by adding
    // the current scroll offset. Assigning rect values directly only
    // lines up at scroll position zero.
    var top = rect.top + window.scrollY;
    var left = rect.right + window.scrollX + 6;

    popover.style.top = top + 'px';
    popover.style.left = left + 'px';
  }

  function open(marker) {
    var n = marker.getAttribute('data-footnote');
    var content = document.getElementById('footnote-' + n);
    if (!content) return;

    if (openMarker && openMarker !== marker) {
      openMarker.setAttribute('aria-expanded', 'false');
    }

    popoverNum.textContent = n;
    popoverBody.innerHTML = content.innerHTML;

    marker.setAttribute('aria-expanded', 'true');
    openMarker = marker;

    position(marker);

    if (isMobile()) {
      scrim.hidden = false;
    }

    popover.hidden = false;

    if (isMobile()) {
      closeBtn.focus();
    }
  }

  function close() {
    if (!openMarker) return;

    popover.hidden = true;
    scrim.hidden = true;

    var marker = openMarker;
    marker.setAttribute('aria-expanded', 'false');
    openMarker = null;

    if (document.body.contains(marker)) {
      marker.focus();
    }
  }

  function onDocumentClick(e) {
    if (!openMarker || popover.hidden) return;
    if (popover.contains(e.target) || e.target.closest('.footnote-marker')) return;
    close();
  }

  function onKeydown(e) {
    if (e.key === 'Escape' && openMarker) close();
  }

  function onResize() {
    if (openMarker && !popover.hidden) close();
  }

  function init() {
    var markers = document.querySelectorAll('.footnote-marker');
    if (!markers.length) return;

    build();

    markers.forEach(function (marker) {
      marker.addEventListener('click', function () {
        if (openMarker === marker && !popover.hidden) {
          close();
        } else {
          open(marker);
        }
      });
    });

    document.addEventListener('click', onDocumentClick);
    document.addEventListener('keydown', onKeydown);
    window.addEventListener('resize', onResize);
  }

  document.addEventListener('DOMContentLoaded', init);

}());
