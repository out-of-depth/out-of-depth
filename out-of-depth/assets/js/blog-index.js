(function () {
  var CACHE_KEY = 'ood_posts_json';
  var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var CAT_SLUG = {
    'Film & TV': 'film-tv',
    'TTRPGs':    'ttrpg',
    'Life':      'life',
    'Games':     'games',
    'Reading':   'reading'
  };
  var CAT_GLYPH = {
    'film-tv': '✦',
    'ttrpg':   '⚔',
    'life':    '♥',
    'games':   '◉',
    'reading': '◎'
  };

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function fmtDate(iso) {
    var d = new Date(iso + 'T12:00:00');
    return MONTHS[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
  }

  function buildRows(posts) {
    var box = document.querySelector('.card-box');
    if (!box) return;
    box.innerHTML = '';

    posts.forEach(function (post, i) {
      var slug  = CAT_SLUG[post.category] || post.category.toLowerCase().replace(/\s+/g, '-');
      var glyph = post.glyph || CAT_GLYPH[slug] || '◈';

      if (i > 0) {
        var hr = document.createElement('hr');
        hr.className = 'post-divider';
        box.appendChild(hr);
      }

      var a = document.createElement('a');
      a.className = 'post-row h-entry u-url' + (i === 0 ? ' active' : '');
      a.href = post.path;
      a.dataset.category = slug;
      a.innerHTML =
        '<div class="post-portrait">' + esc(glyph) + '</div>' +
        '<div class="post-stats">' +
          '<div class="post-name p-name">' + esc(post.title) + '</div>' +
          '<div class="post-stat-line"><span class="stat-label">CAT</span><span class="stat-value p-category">' + esc(post.category) + '</span></div>' +
          '<div class="post-stat-line"><span class="stat-label">DATE</span><time class="stat-value dt-published" datetime="' + esc(post.date) + '">' + esc(fmtDate(post.date)) + '</time></div>' +
          '<div class="post-stat-line"><span class="stat-label">ABOUT</span><span class="stat-value p-summary">' + esc(post.excerpt) + '</span></div>' +
        '</div>';

      a.addEventListener('click', function () {
        document.querySelectorAll('.post-row').forEach(function (r) { r.classList.remove('active'); });
        a.classList.add('active');
      });

      box.appendChild(a);
    });
  }

  window.filterCat = function (btn, category) {
    document.querySelectorAll('.cat-card').forEach(function (c) { c.classList.remove('active'); });
    btn.classList.add('active');
    document.querySelectorAll('.post-row').forEach(function (row) {
      row.classList.toggle('filtered-out', category !== 'all' && row.dataset.category !== category);
    });
    document.querySelectorAll('.post-divider').forEach(function (d) {
      var next = d.nextElementSibling;
      d.style.display = (next && next.classList.contains('filtered-out')) ? 'none' : '';
    });
  };

  function init(data) {
    var posts = (data.posts || [])
      .filter(function (p) { return p.type === 'blog' && p.live; })
      .sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
    buildRows(posts);
  }

  var cached = sessionStorage.getItem(CACHE_KEY);
  if (cached) {
    init(JSON.parse(cached));
  } else {
    fetch('/assets/data/posts.json')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
        init(data);
      });
  }
}());
