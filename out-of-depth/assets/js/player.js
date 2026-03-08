/**
 * OODPlayer – single global audio player for Out of Depth
 *
 * Supports:
 *   - Episode pages  (panel IDs: btnPlay, iconPlay/Pause, btnBack, btnFwd,
 *                               scrubWrap, scrubFill, timeElapsed, timeDuration)
 *   - Podcast index  (panel IDs: btn-play, btn-back, btn-fwd, btn-speed,
 *                               cp-progress, cp-progress-wrap, cp-current, cp-duration,
 *                               cp-cover, cp-season, cp-title, cp-link)
 *   - Fixed bottom bar (#ood-bar) on every page
 *   - sessionStorage persistence so audio survives page navigation
 */
(function () {
  'use strict';

  // Maps data-season attribute values → cover image slug
  var COVER_MAP = {
    sapphire:  'sapphire-doom',
    hackway:   'hackway-heights',
    analysis:  'analysis-complete',
    fiftycent: 'fifty-cent-souls',
    sunbeams:  'sunbeams'
  };

  var SS_KEY   = 'ood_player';
  var speeds   = [1, 1.25, 1.5, 2];
  var speedIdx = 0;

  // One audio element for the whole site
  var audio = new Audio();
  audio.preload = 'metadata';

  // Current meta
  var meta = { src: '', title: '', season: '', coverSlug: '', epUrl: '' };

  // ── Helpers ─────────────────────────────────────────────────────────────

  function fmt(s) {
    if (!isFinite(s)) return '\u2013:\u2013\u2013';
    var m  = Math.floor(s / 60);
    var ss = String(Math.floor(s % 60)).padStart(2, '0');
    return m + ':' + ss;
  }

  function coverUrl(slug) {
    return '/assets/images/podcast/' + slug + '.jpg';
  }

  function saveState() {
    try {
      sessionStorage.setItem(SS_KEY, JSON.stringify({
        src:       meta.src,
        title:     meta.title,
        season:    meta.season,
        coverSlug: meta.coverSlug,
        epUrl:     meta.epUrl,
        time:      audio.currentTime,
        playing:   !audio.paused
      }));
    } catch (e) {}
  }

  function getState() {
    try { return JSON.parse(sessionStorage.getItem(SS_KEY) || 'null'); }
    catch (e) { return null; }
  }

  // ── Core controls ────────────────────────────────────────────────────────

  function togglePlay() {
    if (!audio.src) return;
    if (audio.paused) audio.play().catch(function () {});
    else audio.pause();
  }

  function cycleSpeed(btn) {
    speedIdx = (speedIdx + 1) % speeds.length;
    audio.playbackRate = speeds[speedIdx];
    if (btn) btn.textContent = speeds[speedIdx] + '\u00d7';
  }

  // ── Load ─────────────────────────────────────────────────────────────────

  function load(cfg) {
    meta = {
      src:       cfg.src       || '',
      title:     cfg.title     || '',
      season:    cfg.season    || '',
      coverSlug: cfg.coverSlug || '',
      epUrl:     cfg.epUrl     || ''
    };
    if (audio.src !== meta.src) audio.src = meta.src;
    updateBarMeta(meta);
    updateIndexMeta(meta);
    saveState();
  }

  // ── Global bar ───────────────────────────────────────────────────────────

  var B = {};

  function initBar() {
    B.el = document.getElementById('ood-bar');
    if (!B.el) return;

    B.cover    = document.getElementById('ood-bar-cover');
    B.season   = document.getElementById('ood-bar-season');
    B.title    = document.getElementById('ood-bar-title');
    B.fill     = document.getElementById('ood-bar-fill');
    B.current  = document.getElementById('ood-bar-current');
    B.duration = document.getElementById('ood-bar-duration');
    B.scrub    = document.getElementById('ood-bar-scrub');
    B.playBtn  = document.getElementById('ood-bar-play');
    B.link     = document.getElementById('ood-bar-link');
    B.backBtn  = document.getElementById('ood-bar-back');
    B.fwdBtn   = document.getElementById('ood-bar-fwd');
    B.speedBtn = document.getElementById('ood-bar-speed');

    B.playBtn.addEventListener('click', togglePlay);
    B.backBtn.addEventListener('click', function () {
      audio.currentTime = Math.max(0, audio.currentTime - 15);
    });
    B.fwdBtn.addEventListener('click', function () { audio.currentTime += 15; });
    B.speedBtn.addEventListener('click', function () { cycleSpeed(B.speedBtn); });

    // Scrub – click + drag
    var dragging = false;
    B.scrub.addEventListener('mousedown', function () { dragging = true; });
    window.addEventListener('mouseup', function (e) {
      if (!dragging || !audio.duration) { dragging = false; return; }
      dragging = false;
      var r = B.scrub.getBoundingClientRect();
      audio.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * audio.duration;
    });
    window.addEventListener('mousemove', function (e) {
      if (!dragging || !audio.duration) return;
      var r   = B.scrub.getBoundingClientRect();
      var pct = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      if (B.fill)    B.fill.style.width   = (pct * 100) + '%';
      if (B.current) B.current.textContent = fmt(pct * audio.duration);
    });
    B.scrub.addEventListener('click', function (e) {
      if (!audio.duration) return;
      var r = B.scrub.getBoundingClientRect();
      audio.currentTime = ((e.clientX - r.left) / r.width) * audio.duration;
    });
  }

  function showBar() {
    if (!B.el) return;
    B.el.removeAttribute('hidden');
    document.body.classList.add('has-player-bar');
  }

  function updateBarMeta(m) {
    if (!B.el) return;
    if (B.cover)  { B.cover.src = coverUrl(m.coverSlug); B.cover.alt = m.season; }
    if (B.season) B.season.textContent = m.season;
    if (B.title)  B.title.textContent  = m.title;
    if (B.link)   B.link.href          = m.epUrl;
  }

  function updateBarTime() {
    if (!audio.duration) return;
    var pct = audio.currentTime / audio.duration;
    if (B.fill)    B.fill.style.width   = (pct * 100) + '%';
    if (B.current) B.current.textContent = fmt(audio.currentTime);
  }

  // ── Panel: episode page ──────────────────────────────────────────────────

  function initEpisodePanel() {
    var audioEl = document.getElementById('audio');
    if (!audioEl) return;

    // Read this page's meta
    var srcEl = audioEl.querySelector('source[type="audio/mpeg"]') || audioEl.querySelector('source');
    var src   = srcEl ? srcEl.src : '';

    var coverImg  = document.querySelector('.player-cover img');
    var coverSlug = '';
    if (coverImg) {
      var cm = (coverImg.getAttribute('src') || '').match(/podcast\/([^./]+)\.jpg/);
      if (cm) coverSlug = cm[1];
    }

    var pageMeta = {
      src:       src,
      title:     ((document.querySelector('.player-title') || {}).textContent || '').trim(),
      season:    ((document.querySelector('.player-label')  || {}).textContent || '').trim(),
      coverSlug: coverSlug,
      epUrl:     window.location.pathname
    };

    // Restore saved position if it's the same episode
    var state = getState();
    if (state && state.src === src && src) {
      audio.src = src;
      meta = pageMeta;
      audio.addEventListener('loadedmetadata', function () {
        audio.currentTime = state.time || 0;
      }, { once: true });
      updateBarMeta(pageMeta);
      showBar();
    }

    // Panel elements
    var btnPlay    = document.getElementById('btnPlay');
    var iconPlay   = document.getElementById('iconPlay');
    var iconPause  = document.getElementById('iconPause');
    var btnBack    = document.getElementById('btnBack');
    var btnFwd     = document.getElementById('btnFwd');
    var scrubWrap  = document.getElementById('scrubWrap');
    var scrubFill  = document.getElementById('scrubFill');
    var timeEl     = document.getElementById('timeElapsed');
    var durEl      = document.getElementById('timeDuration');

    function setPanelPlaying(p) {
      if (iconPlay)  iconPlay.style.display  = p ? 'none' : '';
      if (iconPause) iconPause.style.display = p ? '' : 'none';
    }

    if (btnPlay) {
      btnPlay.addEventListener('click', function () {
        // First play on this page: load this episode
        if (!audio.src || audio.src !== src) load(pageMeta);
        else if (meta.src !== src)            load(pageMeta);
        togglePlay();
      });
    }

    if (btnBack) btnBack.addEventListener('click', function () {
      audio.currentTime = Math.max(0, audio.currentTime - 15);
    });
    if (btnFwd) btnFwd.addEventListener('click', function () { audio.currentTime += 15; });

    audio.addEventListener('play',  function () { setPanelPlaying(true); });
    audio.addEventListener('pause', function () { setPanelPlaying(false); });
    audio.addEventListener('ended', function () { setPanelPlaying(false); });

    audio.addEventListener('timeupdate', function () {
      if (!audio.duration) return;
      if (scrubFill) scrubFill.style.width = (audio.currentTime / audio.duration * 100) + '%';
      if (timeEl)    timeEl.textContent    = fmt(audio.currentTime);
    });
    audio.addEventListener('durationchange', function () {
      if (durEl) durEl.textContent = fmt(audio.duration);
    });

    // Scrub – click + drag
    if (scrubWrap) {
      var dragging = false;
      scrubWrap.addEventListener('mousedown', function () { dragging = true; });
      window.addEventListener('mouseup', function (e) {
        if (!dragging || !audio.duration) { dragging = false; return; }
        dragging = false;
        var r = scrubWrap.getBoundingClientRect();
        audio.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * audio.duration;
      });
      window.addEventListener('mousemove', function (e) {
        if (!dragging || !audio.duration) return;
        var r   = scrubWrap.getBoundingClientRect();
        var pct = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
        if (scrubFill) scrubFill.style.width = (pct * 100) + '%';
        if (timeEl)    timeEl.textContent    = fmt(pct * audio.duration);
      });
      scrubWrap.addEventListener('click', function (e) {
        if (!audio.duration) return;
        var r = scrubWrap.getBoundingClientRect();
        audio.currentTime = ((e.clientX - r.left) / r.width) * audio.duration;
      });
    }
  }

  // ── Panel: podcast index page ────────────────────────────────────────────

  function initIndexPanel() {
    var btnPlay    = document.getElementById('btn-play');
    var btnBack    = document.getElementById('btn-back');
    var btnFwd     = document.getElementById('btn-fwd');
    var btnSpeed   = document.getElementById('btn-speed');
    var progress   = document.getElementById('cp-progress');
    var progWrap   = document.getElementById('cp-progress-wrap');
    var cpCurrent  = document.getElementById('cp-current');
    var cpDuration = document.getElementById('cp-duration');

    // Determine what to load: saved state, or the first episode row
    var state    = getState();
    var firstRow = document.querySelector('.episode-row');

    if (state && state.src) {
      // Restore previously-playing episode into panel
      load(state);
      audio.addEventListener('loadedmetadata', function () {
        audio.currentTime = state.time || 0;
      }, { once: true });
      updateIndexMeta(state);
      showBar();
    } else if (firstRow && firstRow.dataset.audio) {
      var seasonSlug = firstRow.dataset.season || '';
      var epTitleEl  = firstRow.querySelector('.ep-title');
      load({
        src:       firstRow.dataset.audio,
        title:     epTitleEl ? epTitleEl.textContent.trim() : '',
        season:    firstRow.dataset.seasonName || '',
        coverSlug: COVER_MAP[seasonSlug] || seasonSlug,
        epUrl:     firstRow.getAttribute('href') || ''
      });
    }

    function setPanelPlaying(p) {
      if (btnPlay) btnPlay.innerHTML = p ? '&#9646;&#9646;' : '&#9654;';
    }

    if (btnPlay)  btnPlay.addEventListener('click', togglePlay);
    if (btnBack)  btnBack.addEventListener('click', function () {
      audio.currentTime = Math.max(0, audio.currentTime - 15);
    });
    if (btnFwd)   btnFwd.addEventListener('click',  function () { audio.currentTime += 15; });
    if (btnSpeed) btnSpeed.addEventListener('click', function () { cycleSpeed(btnSpeed); });

    audio.addEventListener('play',  function () { setPanelPlaying(true); });
    audio.addEventListener('pause', function () { setPanelPlaying(false); });
    audio.addEventListener('ended', function () { setPanelPlaying(false); });

    audio.addEventListener('timeupdate', function () {
      if (!audio.duration) return;
      var pct = (audio.currentTime / audio.duration) * 100;
      if (progress)  progress.style.width  = pct + '%';
      if (cpCurrent) cpCurrent.textContent = fmt(audio.currentTime);
    });
    audio.addEventListener('loadedmetadata', function () {
      if (cpDuration) cpDuration.textContent = fmt(audio.duration);
    });

    if (progWrap) {
      progWrap.addEventListener('click', function (e) {
        if (!audio.duration) return;
        var r = progWrap.getBoundingClientRect();
        audio.currentTime = ((e.clientX - r.left) / r.width) * audio.duration;
      });
    }
  }

  function updateIndexMeta(m) {
    var cpCover  = document.getElementById('cp-cover');
    var cpSeason = document.getElementById('cp-season');
    var cpTitle  = document.getElementById('cp-title');
    var cpLink   = document.getElementById('cp-link');
    if (cpCover)  { cpCover.src = coverUrl(m.coverSlug); cpCover.alt = m.season; }
    if (cpSeason) cpSeason.textContent = m.season;
    if (cpTitle)  cpTitle.textContent  = m.title;
    if (cpLink)   cpLink.href          = m.epUrl;
  }

  // ── Global audio events ──────────────────────────────────────────────────

  audio.addEventListener('play', function () {
    showBar();
    if (B.playBtn) B.playBtn.innerHTML = '&#9646;&#9646;';
    saveState();
  });
  audio.addEventListener('pause', function () {
    if (B.playBtn) B.playBtn.innerHTML = '&#9654;';
    saveState();
  });
  audio.addEventListener('ended', function () {
    if (B.playBtn) B.playBtn.innerHTML = '&#9654;';
  });
  audio.addEventListener('timeupdate', function () {
    updateBarTime();
    if (Math.floor(audio.currentTime) % 5 === 0) saveState();
  });
  audio.addEventListener('loadedmetadata', function () {
    if (B.duration) B.duration.textContent = fmt(audio.duration);
  });

  // ── Init ─────────────────────────────────────────────────────────────────

  function init() {
    initBar();

    if (document.getElementById('audio')) {
      initEpisodePanel();
    } else if (document.querySelector('.episode-row')) {
      initIndexPanel();
    } else {
      // Non-player page: restore bar from saved state
      var state = getState();
      if (state && state.src) {
        load(state);
        audio.addEventListener('loadedmetadata', function () {
          audio.currentTime = state.time || 0;
          if (state.playing) audio.play().catch(function () {});
        }, { once: true });
        showBar();
      }
    }
  }

  // Public API
  window.OODPlayer = { load: load, togglePlay: togglePlay, audio: audio };

  document.addEventListener('DOMContentLoaded', init);
}());
