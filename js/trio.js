/* ═══════════════════════════════════════════════════════════
   BREW TRIO — photorealistic, real-world macOS window apps
   the-barista.pdf  · macOS Preview: Barista Craft Handbook & Extraction Physics
   the-espresso.mov · iOS style video player (clean, zero text clutter inside frame)
   the-bean.jpg     · macOS Photos: Specialty Micro-Lot Cupping Field Notes
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var root = document.getElementById('trioApps');
  if (!root) return;
  function $(s, c) { return (c || root).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || root).querySelectorAll(s)); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* ─────────── 1 · the-barista.pdf (macOS Preview) ─────────── */
  (function barista() {
    var win = document.getElementById('winBarista'); if (!win) return;
    var doc = $('.tx-doc', win), pages = $$('.tx-page', win), dots = $$('.tx-dots button', win);
    var prev = $('.tx-prev', win), next = $('.tx-next', win), num = $('.tx-pgn', win);
    var cur = 1, N = pages.length;

    function go(n) {
      n = clamp(n, 1, N); if (n === cur) return;
      pages.forEach(function (p) {
        var i = +p.dataset.p;
        p.classList.toggle('is-on', i === n);
        p.classList.toggle('is-left', i < n);
        p.setAttribute('aria-hidden', i === n ? 'false' : 'true');
      });
      dots.forEach(function (d) { var on = +d.dataset.go === n; d.classList.toggle('is-on', on); d.setAttribute('aria-selected', on); });
      cur = n; num.textContent = n;
      prev.disabled = n === 1; next.disabled = n === N;
    }

    pages.forEach(function (p) { p.setAttribute('aria-hidden', p.classList.contains('is-on') ? 'false' : 'true'); });
    prev.addEventListener('click', function () { go(cur - 1); });
    next.addEventListener('click', function () { go(cur + 1); });
    dots.forEach(function (d) { d.addEventListener('click', function () { go(+d.dataset.go); }); });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); go(cur + 1); }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(cur - 1); }
    });

    var sx = null;
    doc.addEventListener('pointerdown', function (e) { sx = e.clientX; });
    doc.addEventListener('pointerup', function (e) {
      if (sx === null) return;
      var dx = e.clientX - sx; sx = null;
      if (Math.abs(dx) > 40) { go(cur + (dx < 0 ? 1 : -1)); return; }
      var r = doc.getBoundingClientRect(), x = (e.clientX - r.left) / r.width;
      if (x > .78) go(cur + 1); else if (x < .22) go(cur - 1);
    });
  })();

  /* ─────────── 2 · the-espresso.mov (iOS Style Video Player) ─────────── */
  (function espresso() {
    var win = document.getElementById('winEspresso'); if (!win) return;
    var frame = $('#iosPlayerFrame', win), v = $('#qtVid', win);
    var cta = $('#espressoCta', win);
    var closeBtn = $('#iosCloseBtn', win);
    var playBtn = $('#iosPlayBtn', win), playIcon = $('#iosPlayIcon', win);
    var track = $('#iosTrack', win), fill = $('#iosFill', win);
    var spkBtn = $('#iosSpkBtn', win), vFill = $('#iosVFill', win);

    var PLAY_PATH = 'M8.2 5.4 18.4 12 8.2 18.6z';
    var PAUSE_PATH = 'M8.6 5.8v12.4M15.4 5.8v12.4';

    var sleepTimer = null;

    function isOpen() { return frame.getAttribute('data-player') === 'on'; }

    function wake() {
      if (!isOpen()) return;
      frame.classList.add('is-awake');
      clearTimeout(sleepTimer);
      if (!v.paused) {
        sleepTimer = setTimeout(function () {
          if (!v.paused && isOpen()) frame.classList.remove('is-awake');
        }, 2600);
      }
    }

    function syncState() {
      var isPlaying = !v.paused && !v.ended;
      if (isPlaying) {
        if (playIcon) playIcon.innerHTML = '<path d="' + PAUSE_PATH + '" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>';
        if (playBtn) playBtn.setAttribute('aria-label', 'Pause video');
        if (isOpen()) wake();
      } else {
        if (playIcon) playIcon.innerHTML = '<path d="' + PLAY_PATH + '" fill="currentColor"/>';
        if (playBtn) playBtn.setAttribute('aria-label', 'Play video');
        if (isOpen()) frame.classList.add('is-awake');
      }
    }

    function openPlayer() {
      frame.setAttribute('data-player', 'on');
      frame.classList.add('is-awake');
      v.muted = false;
      v.currentTime = 0;
      v.play().then(syncState).catch(function () {});
      wake();
    }

    function closePlayer() {
      frame.removeAttribute('data-player');
      frame.classList.remove('is-awake');
      clearTimeout(sleepTimer);
      v.muted = true;
      v.play().then(syncState).catch(function () {});
    }

    if (cta) cta.addEventListener('click', function (e) { e.stopPropagation(); openPlayer(); });
    if (closeBtn) closeBtn.addEventListener('click', function (e) { e.stopPropagation(); closePlayer(); });

    function togglePlay() {
      if (v.paused || v.ended) {
        v.play().then(syncState).catch(function () {});
      } else {
        v.pause();
        syncState();
      }
    }

    var skipBack = $('#iosSkipBack', win), skipFwd = $('#iosSkipFwd', win);

    if (playBtn) playBtn.addEventListener('click', function (e) { e.stopPropagation(); togglePlay(); });
    if (skipBack) {
      skipBack.addEventListener('click', function (e) {
        e.stopPropagation();
        if (v) { v.currentTime = Math.max(0, (v.currentTime || 0) - 5); }
        wake();
      });
    }
    if (skipFwd) {
      skipFwd.addEventListener('click', function (e) {
        e.stopPropagation();
        if (v) {
          var maxT = isFinite(v.duration) && v.duration ? v.duration : 999;
          v.currentTime = Math.min(maxT, (v.currentTime || 0) + 5);
        }
        wake();
      });
    }
    if (v) {
      v.addEventListener('click', function () {
        if (!isOpen()) { openPlayer(); return; }
        if (frame.classList.contains('is-awake') && !v.paused) {
          togglePlay();
        } else {
          wake();
        }
      });
      v.addEventListener('timeupdate', function () {
        var cur = v.currentTime || 0, dur = v.duration || 6;
        var p = (cur / dur) * 100;
        if (fill) fill.style.width = p.toFixed(1) + '%';
        if (track) track.setAttribute('aria-valuenow', Math.round(p));
      });
      v.addEventListener('play', syncState);
      v.addEventListener('pause', syncState);
      v.addEventListener('ended', syncState);
    }

    if (track) {
      function seek(e) {
        var r = track.getBoundingClientRect();
        var cx = e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX;
        var f = clamp((cx - r.left) / r.width, 0, 1);
        if (v && v.duration) v.currentTime = f * v.duration;
        wake();
      }
      track.addEventListener('click', function (e) { e.stopPropagation(); seek(e); });
    }

    if (spkBtn) {
      spkBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        v.muted = !v.muted;
        if (vFill) vFill.style.width = v.muted ? '0%' : '100%';
        spkBtn.style.opacity = v.muted ? '0.5' : '1';
        wake();
      });
    }

    frame.addEventListener('pointerenter', function () { if (isOpen()) wake(); });
    frame.addEventListener('pointermove', function () { if (isOpen()) wake(); });
    frame.addEventListener('pointerleave', function () {
      if (isOpen() && !v.paused) frame.classList.remove('is-awake');
    });
  })();

  /* ─────────── 3 · the-bean.jpg (macOS Photos) ─────────── */
  (function bean() {
    var win = document.getElementById('winBean'); if (!win) return;
    var origBtns = $$('.bx-origins button', win);
    var title = $('#phTitle', win), sub = $('#phSub', win), process = $('#phProcess', win);
    var roastChip = $('#phRoastChip', win), roastName = $('#phRoastName', win);
    var exifTag = $('#bxExifTag', win), scoreEl = $('#phScore', win), notesWrap = $('#phNotes', win);
    var bAcid = $('#bAcid', win), bSweet = $('#bSweet', win), bBody = $('#bBody', win), bFinish = $('#bFinish', win);
    var vAcid = $('#vAcid', win), vSweet = $('#vSweet', win), vBody = $('#vBody', win), vFinish = $('#vFinish', win);

    var ORIGINS = {
      npl: {
        title: 'Palpa & Gulmi Organic Micro-Lot',
        sub: 'Himalayan Foothills, Nepal · 1,450 MASL · Washed Typica',
        process: 'Spring Harvest · Himalayan Spring Water Fermentation',
        roastChip: 'SHADE-GROWN CARDAMOM CANOPY',
        roastName: 'City Roast (Medium-Light, Agtron 66)',
        exif: 'Palpa 1,450m',
        score: '87.5',
        scores: { acid: 82, sweet: 88, body: 78, finish: 87 },
        scoresVal: { acid: '8.2', sweet: '8.8', body: '7.8', finish: '8.7' },
        notes: ['mountain honey', 'ginger blossom', 'cardamom spice', 'sweet sugarcane']
      },
      eth: {
        title: 'Gedeb Yirgacheffe Anaerobic',
        sub: 'Southern Highlands, Ethiopia · 2,100 MASL · Heirloom',
        process: '72hr Whole-Cherry Anaerobic Barrel Fermentation',
        roastChip: 'HIGH-ALTITUDE MICRO-CLIMATE',
        roastName: 'Light Filter Roast (Agtron 72)',
        exif: 'Gedeb 2,100m',
        score: '89.0',
        scores: { acid: 89, sweet: 88, body: 74, finish: 86 },
        scoresVal: { acid: '8.9', sweet: '8.8', body: '7.4', finish: '8.6' },
        notes: ['lavender floral', 'candied peach', 'ripe blueberry', 'bergamot syrup']
      },
      col: {
        title: 'Huila Pitalito Thermal Shock',
        sub: 'Andes Cordillera, Colombia · 1,750 MASL · Pink Bourbon',
        process: 'Controlled Thermal-Shock Washed · High Brix',
        roastChip: 'PRECISION MICRO-FERMENT',
        roastName: 'Medium-Light Omni Roast (Agtron 62)',
        exif: 'Huila 1,750m',
        score: '88.5',
        scores: { acid: 85, sweet: 89, body: 82, finish: 90 },
        scoresVal: { acid: '8.5', sweet: '8.9', body: '8.2', finish: '9.0' },
        notes: ['pink guava', 'passionfruit', 'cacao nibs', 'crystalline panela']
      }
    };

    origBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.dataset.o, data = ORIGINS[key];
        if (!data) return;
        origBtns.forEach(function (b) { b.classList.toggle('is-on', b === btn); });

        title.textContent = data.title;
        sub.textContent = data.sub;
        process.textContent = data.process;
        roastChip.textContent = data.roastChip;
        roastName.textContent = data.roastName;
        if (exifTag) exifTag.textContent = data.exif;
        if (scoreEl) scoreEl.textContent = data.score;

        bAcid.style.width = data.scores.acid + '%';
        bSweet.style.width = data.scores.sweet + '%';
        bBody.style.width = data.scores.body + '%';
        bFinish.style.width = data.scores.finish + '%';

        vAcid.textContent = data.scoresVal.acid;
        vSweet.textContent = data.scoresVal.sweet;
        vBody.textContent = data.scoresVal.body;
        vFinish.textContent = data.scoresVal.finish;

        notesWrap.innerHTML = '';
        data.notes.forEach(function (n) {
          var s = document.createElement('span');
          s.textContent = n;
          notesWrap.appendChild(s);
        });
      });
    });
  })();
})();
