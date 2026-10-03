/* ═══════════════════════════════════════════════════════════
   WILLSON RAI — cosmic desk · vanilla js (v3)
   window manager · notifications · spotlight · dock · messages
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var body = document.body;
  var mq = window.matchMedia ? window.matchMedia.bind(window) : function () { return { matches: false }; };
  var reduce = mq('(prefers-reduced-motion: reduce)').matches;
  var EMAIL = 'resume@willsonrai.com.np';
  var PHONE = '+9779765829096';
  function noop() {}
  var resumeClips = noop; /* the video module owns clip lifecycle; settings only ask */

  /* ─────────── prefs ─────────── */
  var S = { stars: 'on', motion: reduce ? 'reduced' : 'full', dock: 'on', glass: 8, accent: 'ice', density: 150, notifs: 'on', bright: 100, vol: 0, lastVol: 40 };
  try {
    var saved = JSON.parse(localStorage.getItem('wr-cosmos') || '{}');
    Object.keys(saved).forEach(function (k) { if (k in S) S[k] = saved[k]; });
    S.glass = Math.max(8, Math.min(20, +S.glass || 8));
    S.density = Math.max(40, Math.min(300, +S.density || 150));
    S.vol = Math.max(0, Math.min(100, +S.vol || 0));
    S.lastVol = Math.max(1, Math.min(100, +S.lastVol || 40));
  } catch (e) {}
  // The operating-system accessibility preference wins on page load; the site switch can still override it for this session.
  if (reduce) S.motion = 'reduced';
  function save() { try { localStorage.setItem('wr-cosmos', JSON.stringify(S)); } catch (e) {} }
  function set(sel, txt) { var el = $(sel); if (el) el.textContent = txt; }
  var ACC_TINT = { ice: '207,228,255', grape: '233,214,255', rose: '255,220,228', moss: '214,255,226', amber: '255,236,205' };
  var accTimer = null;
  function setAccent(a) {
    if (S.accent === a) return;
    S.accent = a; save(); applyState();
    var h = document.documentElement;
    h.classList.add('accenting');
    clearTimeout(accTimer);
    accTimer = setTimeout(function () { h.classList.remove('accenting'); }, 420);
  }

  function applyState() {
    body.dataset.stars = S.stars;
    body.dataset.motion = S.motion;
    body.dataset.dock = S.dock;
    body.dataset.glass = String(S.glass);
    body.dataset.notifs = S.notifs;
    document.documentElement.dataset.accent = S.accent;
    document.documentElement.style.setProperty('--glass-a', (S.glass / 100).toFixed(3));
    var on = S.stars === 'on', red = S.motion === 'reduced', dk = S.dock === 'on', nt = S.notifs === 'on';
    set('#starsHint', on ? 'On' : 'Off');
    set('#dockHint', dk ? 'Shown' : 'Hidden');
    set('#notifHint', nt ? 'On' : 'Off');
    set('#ccGlass', S.glass + '%');
    set('#ccDens', String(S.density));
    $$('.ccir[data-cc]').forEach(function (b) {
      var k = b.dataset.cc;
      var on2 = (k === 'stars' && on) || (k === 'motion' && red) || (k === 'dock' && dk) || (k === 'notifs' && nt);
      b.setAttribute('aria-checked', on2 ? 'true' : 'false');
    });
    $$('.sw').forEach(function (b) { b.classList.toggle('is-active', b.dataset.setAccent === S.accent); });
    set('#ccAccentName', S.accent);
    if (red) $$('video').forEach(function (v) { v.pause(); });
    else resumeClips();
    paintSlide('glass'); paintSlide('stars'); paintSlide('bright'); paintSlide('vol');
    applyDim(); applyVol();
    segPaint($('#timerSeg'));
    Star.tint(ACC_TINT[S.accent] || ACC_TINT.ice);
    on && !red ? Star.play() : Star.stop();
  }
  var motionPreference = mq('(prefers-reduced-motion: reduce)');
  function followReducedMotion(e) {
    if (!e.matches || S.motion === 'reduced') return;
    S.motion = 'reduced'; save(); applyState();
  }
  if (motionPreference.addEventListener) motionPreference.addEventListener('change', followReducedMotion);
  else if (motionPreference.addListener) motionPreference.addListener(followReducedMotion);

  function applyDim() {
    document.documentElement.style.setProperty('--dim', ((100 - S.bright) / 100 * .85).toFixed(3));
    set('#ccBright', S.bright + '%');
  }
  function applyVol() {
    var v = S.vol / 100;
    $$('video').forEach(function (el) { el.volume = v; el.muted = S.vol === 0; });
    set('#ccClipAudioState', S.vol === 0 ? 'muted by default' : 'site sound · ' + S.vol + '%');
    paintMute(S.vol > 0);
    set('#ccVol', S.vol + '%');
    var tile = $('.ccsl[data-slide="vol"]');
    if (tile) tile.setAttribute('aria-valuetext', S.vol === 0 ? 'muted' : S.vol + ' percent');
  }
  /* One shared sound level for every clip; unmuting from a video button restores the last level. */
  function setVolume(next, remember) {
    next = Math.max(0, Math.min(100, Math.round(next)));
    if (remember !== false && next > 0) S.lastVol = next;
    S.vol = next; save(); applyVol();
  }
  function paintMute(on) {
    $$('.video-mute').forEach(function (b) {
      b.setAttribute('aria-pressed', String(on));
      b.setAttribute('aria-label', on ? 'Mute video' : 'Unmute video');
      b.title = on ? 'Mute all clips' : 'Unmute all clips';
      b.classList.toggle('is-on', on);
    });
  }

  /* ─────────── live menubar status ─────────── */
  (function () {
    function pw() {
      var cn = navigator.connection || {};
      var online = navigator.onLine;
      set('#wifiPop', online
        ? ('connected · ' + (cn.effectiveType || 'network') + (cn.downlink ? ' · ' + cn.downlink + ' mbps' : ''))
        : 'offline — no network');
      set('#ccNetworkState', online ? 'online' : 'offline');
    }
    pw();
    window.addEventListener('online', pw); window.addEventListener('offline', pw);
    if (navigator.connection && navigator.connection.addEventListener) navigator.connection.addEventListener('change', pw);
    function batteryUnavailable() {
      set('#ccBatteryState', 'unavailable');
      set('#ccBatteryPct', '—%'); set('#desktopBatteryState', 'unavailable');
      var fill = $('#ccBatteryFill'), iconFill = $('#ccBatteryIconFill'), desktopFill = $('#desktopBatteryFill'), meter = $('.cc__battery-track');
      if (fill) fill.style.width = '0%';
      if (iconFill) iconFill.setAttribute('width', '0');
      if (desktopFill) desktopFill.setAttribute('width', '0');
      if (meter) { meter.setAttribute('aria-valuenow', '0'); meter.setAttribute('aria-valuetext', 'unavailable'); }
    }
    if (navigator.getBattery) {
      navigator.getBattery().then(function (b) {
        function pb() {
          var pct = Math.round(b.level * 100);
          set('#ccBatteryState', b.charging ? 'charging' : 'on battery');
          set('#ccBatteryPct', pct + '%'); set('#desktopBatteryState', pct + '% · ' + (b.charging ? 'charging' : 'on battery'));
          var fill = $('#ccBatteryFill'), iconFill = $('#ccBatteryIconFill'), desktopFill = $('#desktopBatteryFill'), meter = $('.cc__battery-track');
          if (fill) fill.style.width = pct + '%';
          if (iconFill) iconFill.setAttribute('width', String(Math.max(1, +(19 * b.level).toFixed(1))));
          if (desktopFill) desktopFill.setAttribute('width', String(Math.max(1, +(18 * b.level).toFixed(1))));
          if (meter) { meter.setAttribute('aria-valuenow', String(pct)); meter.setAttribute('aria-valuetext', pct + '%'); }
        }
        pb(); b.addEventListener('levelchange', pb); b.addEventListener('chargingchange', pb);
      }).catch(batteryUnavailable);
    } else batteryUnavailable();
  })();

  /* ─────────── Heyclicky-style glass video controls ─────────── */
  (function () {
    var ICONS = {
      play: '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M8.5 5.6 18 12l-9.5 6.4z" fill="currentColor"/></svg>',
      pause: '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M8.6 5.8v12.4M15.4 5.8v12.4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
      sound: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5v5h3.4L12 18.6V5.4L7.4 9.5Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M15.5 9.5a4 4 0 0 1 0 5M18 7.4a7 7 0 0 1 0 9.2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
      mute: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5v5h3.4L12 18.6V5.4L7.4 9.5Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="m16 9.6 4.4 4.8M20.4 9.6 16 14.4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>'
    };
    var wired = [], active = null;
    function soundOn() { return S.vol > 0; }
    function paint() {
      wired.forEach(function (w) {
        var playing = !w.vid.paused && !w.vid.ended;
        var t = $('.tri', w.btn), label = $('.play-label', w.btn);
        if (t) t.innerHTML = playing ? ICONS.pause : ICONS.play;
        if (label) label.textContent = playing ? 'pause video' : 'play video';
        w.btn.classList.toggle('is-playing', playing);
        w.btn.setAttribute('aria-label', playing ? 'Pause video' : 'Play video');
        w.btn.setAttribute('aria-pressed', String(playing));
        if (w.shell) w.shell.classList.toggle('is-paused', !playing);
        if (w.mute && w.mute.dataset.on !== String(soundOn())) {
          w.mute.dataset.on = String(soundOn());
          w.mute.innerHTML = soundOn() ? ICONS.sound : ICONS.mute;
        }
      });
      paintMute(soundOn());
    }
    function playingNow() {
      for (var i = 0; i < wired.length; i++) if (!wired[i].vid.paused && !wired[i].vid.ended) return wired[i];
      return null;
    }
    /* the clip nearest the middle of the screen owns playback — same rule the desk windows use */
    function focused() {
      var mid = (window.innerHeight || 0) / 2, best = null, bd = 1e9;
      wired.forEach(function (w) {
        if (!w.want) return;
        var r = w.vid.getBoundingClientRect();
        if (r.bottom <= 0 || r.top >= (window.innerHeight || 0)) return;
        var d = Math.abs(r.top + r.height / 2 - mid);
        if (d < bd) { bd = d; best = w; }
      });
      return best;
    }
    function play(w) {
      if (!w || playingNow() === w) return;
      active = w;
      var p;
      try { p = w.vid.play(); }
      catch (err) { return; }
      if (p && p.catch) p.catch(noop);
    }
    function hold(w) {
      if (!w) return;
      active = w;
      w.want = true;
      if (w.vid.paused && !w.vid.ended) play(w);
    }
    /* one clip plays: whichever the viewer is looking at, or the one they last chose */
    function reconcile() {
      if (S.motion === 'reduced') return;
      var cur = playingNow(), focus = focused();
      if (cur && focus === cur) return;
      if (cur && !focus) { try { cur.vid.pause(); } catch (err) {} return; }
      if (cur && focus !== cur) { try { cur.vid.pause(); } catch (err) {} }
      play(focus);
    }
    function stopOthers(w) {
      wired.forEach(function (o) {
        if (o === w) return;
        o.want = false;
        if (!o.vid.paused) { try { o.vid.pause(); } catch (err) {} }
      });
    }
    /* Opening a clip with sound is fine after a user gesture — starting sound unprompted is not. */
    function selectSound() {
      if (soundOn()) return;
      setVolume(S.lastVol);
      flash('Sound on · ' + S.lastVol + '% — mute any time');
    }
    function start(w, announce) {
      stopOthers(w);
      w.want = true;
      if (w.vid.paused || w.vid.ended) {
        var p;
        try { p = w.vid.play(); }
        catch (err) { if (announce) flash('This video could not start. Tap to try again.'); return; }
        if (p && p.catch) p.catch(function () { if (announce) flash('This video could not start. Tap to try again.'); });
      }
      active = w;
    }
    function toggle(w, announce) {
      if (!w.vid.paused && !w.vid.ended) { w.want = false; w.vid.pause(); return; }
      selectSound();
      start(w, announce);
    }

    function wire(btn, vid) {
      if (!btn || !vid) return;
      var shell = btn.closest('.hero-video__frame,.video-card__frame,.poster');
      var w = { btn: btn, vid: vid, shell: shell, want: vid.hasAttribute('autoplay'), mute: shell ? $('.video-mute', shell) : null };
      wired.push(w);
      btn.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        toggle(w, true);
      });
      /* the plate itself is a play/pause surface too */
      vid.addEventListener('click', function () { toggle(w, true); });
      if (w.mute) w.mute.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        setVolume(soundOn() ? 0 : S.lastVol);
      });
      /* the browser autostarts muted clips on its own: only the clip holding playback may run */
      vid.addEventListener('play', function () {
        if (!active || active.vid !== vid) { try { vid.pause(); } catch (err) {} }
      });
      ['play', 'playing', 'pause', 'ended'].forEach(function (ev) { vid.addEventListener(ev, paint); });
    }

    wire($('#reelCta'), $('#reelVid'));
    wire($('#beansCta'), $('#beansVid'));
    wire($('#frameCta'), $('#latteVid'));
    wire($('#posterCta'), $('#posterVideo'));

    /* clips take turns as they pass the middle of the screen, and pause off-screen */
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function () { reconcile(); }, { threshold: 0 });
      wired.forEach(function (w) { io.observe(w.vid); });
    }
    var rafP = false;
    window.addEventListener('scroll', function () {
      if (rafP) return; rafP = true;
      requestAnimationFrame(function () { rafP = false; reconcile(); });
    }, { passive: true });

    /* the settings panel asks for one clip back, not the whole floor */
    resumeClips = function () {
      var w = (active && active.want) ? active : focused();
      if (w) hold(w); else reconcile();
    };

    paint();
    applyVol();
  })();

  /* ─────────── toast (tiny feedback) ─────────── */
  function flash(msg) {
    var el = $('.toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'toast';
      el.style.cssText = 'position:fixed;left:50%;bottom:96px;translate:-50% 0;z-index:900;padding:8px 15px;border-radius:99px;' +
        'font-size:12.5px;background:rgba(28,26,40,.9);border:1px solid rgba(255,255,255,.14);color:#f2f2f7;' +
        'backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);box-shadow:0 16px 40px rgba(0,0,0,.5);' +
        'opacity:0;transition:opacity .2s,translate .2s;pointer-events:none';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = '1'; el.style.translate = '-50% -6px';
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.style.opacity = '0'; el.style.translate = '-50% 0'; }, 1500);
  }

  /* ─────────── notifications ─────────── */
  var Notify = (function () {
    var tray = $('#notifs');
    var ICONS = {
      window: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3 9.5h18" stroke="currentColor" stroke-width="1.8"/><circle cx="6" cy="7.2" r=".9" fill="currentColor"/></svg>',
      mail: '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2.6" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m4.5 8 7.5 5 7.5-5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
      timer: '<svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="7.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 9.5V13l2.4 1.8M9.5 3h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
      clip: '<svg viewBox="0 0 24 24"><rect x="8" y="3" width="11" height="14" rx="2.4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M16 21H6.5A1.5 1.5 0 0 1 5 19.5V7" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>'
    };
    function push(o) {
      if (!tray || S.notifs === 'off') return;
      var n = document.createElement('div');
      n.className = 'notif';
      n.innerHTML = '<span class="notif__ico pane pane--' + (o.pane || 'b') + '">' + (ICONS[o.icon] || ICONS.window) + '</span>' +
        '<span class="notif__t"><b></b>' + (o.body ? '<p></p>' : '') + '</span>' +
        (o.action ? '<button class="notif__act"></button>' : '') + '<button class="notif__x" aria-label="Dismiss">✕</button>';
      $('.notif__t b', n).textContent = o.title || '';
      var bp = $('.notif__t p', n); if (bp) bp.textContent = o.body || '';
      if (o.action) {
        var ab = $('.notif__act', n);
        ab.textContent = o.action.label;
        ab.addEventListener('click', function (ev) { ev.stopPropagation(); kill(n); o.action.fn(); });
      }
      $('.notif__x', n).addEventListener('click', function (ev) { ev.stopPropagation(); kill(n); });
      n.addEventListener('click', function () { kill(n); });
      tray.appendChild(n);
      while (tray.children.length > 3) kill(tray.firstChild, true);
      n._t = setTimeout(function () { kill(n); }, o.ms || 5000);
      return n;
    }
    function kill(n, instant) {
      if (!n || n._dead) return;
      n._dead = true; clearTimeout(n._t);
      if (instant || reduce) { n.remove(); return; }
      n.classList.add('out');
      setTimeout(function () { n.remove(); }, 260);
    }
    return { push: push };
  })();

  /* ─────────── starfield ─────────── */
  var Star = (function () {
    var cv = $('#stars'), ctx = cv && cv.getContext ? cv.getContext('2d') : null;
    if (!cv || !ctx) return { resize: noop, play: noop, stop: noop, tint: noop };
    var stars = [], shooters = [], w = 0, h = 0, raf = null, t = 0, tint = '190,205,255', mx = 0, my = 0, pmx = 0, pmy = 0;
    window.addEventListener('pointermove', function (e) {
      mx = e.clientX / (window.innerWidth || 1) - .5; my = e.clientY / (window.innerHeight || 1) - .5;
    }, { passive: true });
    function make() {
      stars = [];
      var n = Math.round(S.density * (w * h) / (1440 * 900));
      n = Math.max(45, Math.min(520, n));
      var pal = ['255,255,255', '255,255,255', '255,255,255', tint, '255,225,200', tint];
      for (var i = 0; i < n; i++) {
        stars.push({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.15 + .22,
          a: Math.random() * .55 + .18, sp: Math.random() * .011 + .003, ph: Math.random() * 6.283,
          c: pal[(Math.random() * pal.length) | 0], vx: (Math.random() - .5) * .03 });
      }
    }
    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      make();
    }
    function draw() {
      t++; ctx.clearRect(0, 0, w, h);
      pmx += (mx - pmx) * .045; pmy += (my - pmy) * .045;
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        s.x += s.vx; if (s.x < -3) s.x = w + 3; if (s.x > w + 3) s.x = -3;
        var tw = S.motion === 'reduced' ? 1 : Math.sin(t * s.sp + s.ph) * .5 + .5;
        ctx.beginPath();
        ctx.fillStyle = 'rgba(' + s.c + ',' + (s.a * (.5 + tw * .5)).toFixed(3) + ')';
        ctx.arc(s.x - pmx * 14 * s.r, s.y - pmy * 10 * s.r, s.r, 0, 6.283); ctx.fill();
      }
      if (shooters.length < 3 && Math.random() < .02) {
        shooters.push({ x: Math.random() * w * .8, y: Math.random() * h * .42, l: 0,
          sp: 9 + Math.random() * 7, ang: .3 + Math.random() * .24, tw: .8 + Math.random() * .9 });
      }
      for (var j = shooters.length - 1; j >= 0; j--) {
        var sh = shooters[j]; sh.l += sh.sp;
        var dx = Math.cos(sh.ang), dy = Math.sin(sh.ang);
        var hx = sh.x + dx * sh.l, hy = sh.y + dy * sh.l;
        var tl = Math.min(sh.l, 84 + sh.tw * 46);
        var g = ctx.createLinearGradient(hx - dx * tl, hy - dy * tl, hx, hy);
        g.addColorStop(0, 'rgba(' + tint + ',0)');
        g.addColorStop(.7, 'rgba(' + tint + ',.32)');
        g.addColorStop(1, 'rgba(255,255,255,.9)');
        ctx.strokeStyle = g; ctx.lineCap = 'round'; ctx.lineWidth = 1.4 * sh.tw;
        ctx.beginPath(); ctx.moveTo(hx - dx * tl, hy - dy * tl); ctx.lineTo(hx, hy); ctx.stroke();
        ctx.beginPath(); ctx.fillStyle = 'rgba(255,255,255,.92)';
        ctx.arc(hx, hy, 1.1 * sh.tw, 0, 6.283); ctx.fill();
        if (hx > w + 120 || hy > h + 120) shooters.splice(j, 1);
      }
      raf = requestAnimationFrame(draw);
    }
    resize();
    window.addEventListener('resize', resize);
    if (S.motion !== 'reduced') draw();
    return { resize: resize, play: function () { if (!raf && S.motion !== 'reduced') draw(); },
      stop: function () { if (raf) { cancelAnimationFrame(raf); raf = null; } },
      tint: function (rgb) { if (rgb && rgb !== tint) { tint = rgb; make(); } } };
  })();

  /* ─────────── clocks ─────────── */
  var DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  function nptParts() {
    var d = new Date();
    try {
      var f = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kathmandu', hour: '2-digit', minute: '2-digit', second: '2-digit',
        weekday: 'short', day: 'numeric', month: 'short', hour12: false }).formatToParts(d)
        .reduce(function (a, p) { a[p.type] = p.value; return a; }, {});
      return { h: +f.hour % 24, m: +f.minute, s: +f.second, wd: f.weekday, d: f.day, mo: f.month };
    } catch (e) {
      return { h: d.getHours(), m: d.getMinutes(), s: d.getSeconds(), wd: DAYS[d.getDay()], d: d.getDate(), mo: '' };
    }
  }
  function pad(n) { return String(n).padStart(2, '0'); }
  function clock() {
    var p = nptParts();
    set('#clock', (p.h % 12 || 12) + ':' + pad(p.m) + ' ' + (p.h < 12 ? 'AM' : 'PM'));
    set('#ccClock', (p.h % 12 || 12) + ':' + pad(p.m) + ' ' + (p.h < 12 ? 'AM' : 'PM'));
    set('#clockBig', pad(p.h) + ':' + pad(p.m));
    set('#clockDay', p.wd + ' ' + p.d + ' ' + p.mo + ' · lalitpur, npt');
    var hs = $('#handH'), ms = $('#handM'), ss = $('#handS');
    if (hs && ms && ss) {
      hs.style.transform = 'rotate(' + ((p.h % 12) * 30 + p.m * .5) + 'deg)';
      ms.style.transform = 'rotate(' + (p.m * 6 + p.s * .1) + 'deg)';
      ss.style.transform = 'rotate(' + (p.s * 6) + 'deg)';
    }
  }
  clock(); setInterval(clock, 1000);
  set('#yr', String(new Date().getFullYear()));

  /* ─────────── segmented controls ─────────── */
  function segPaint(seg) {
    if (!seg) return;
    var on = $('.is-on', seg), thumb = $('.seg__thumb', seg);
    if (!on || !thumb) return;
    thumb.style.left = on.offsetLeft + 'px';
    thumb.style.width = on.offsetWidth + 'px';
  }
  function segWire(seg, cb) {
    if (!seg) return;
    seg.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b || !seg.contains(b)) return;
      $$('button', seg).forEach(function (o) { o.classList.remove('is-on'); });
      b.classList.add('is-on'); segPaint(seg); cb(b);
    });
  }
  window.addEventListener('resize', function () { segPaint($('#timerSeg')); });

  function slideRange(kind) { return kind === 'glass' ? { min: 8, max: 20, step: 1, v: S.glass }
    : kind === 'bright' ? { min: 40, max: 100, step: 1, v: S.bright }
    : kind === 'vol' ? { min: 0, max: 100, step: 1, v: S.vol }
    : { min: 40, max: 300, step: 10, v: S.density }; }
  function paintSlide(kind) {
    var tile = $('.ccsl[data-slide="' + kind + '"]'); if (!tile) return;
    var o = slideRange(kind);
    tile.style.setProperty('--p', ((o.v - o.min) / (o.max - o.min)).toFixed(4));
    var inp = $('input', tile); if (inp && +inp.value !== o.v) inp.value = o.v;
  }
  function setSlide(kind, v) {
    var o = slideRange(kind);
    v = Math.max(o.min, Math.min(o.max, Math.round(v / o.step) * o.step));
    if (kind === 'glass') { if (v === S.glass) return; S.glass = v; }
    else if (kind === 'bright') { if (v === S.bright) return; S.bright = v; applyDim(); }
    else if (kind === 'vol') { if (v === S.vol) return; S.vol = v; applyVol(); }
    else { if (v === S.density) return; S.density = v; Star.resize(); }
    save(); applyState();
  }
  $$('.ccsl').forEach(function (tile) {
    var kind = tile.dataset.slide, inp = $('input', tile), dragging = false;
    function fromPoint(e) {
      var r = tile.getBoundingClientRect(); if (!r.height) return;
      var o = slideRange(kind);
      var p = 1 - (e.clientY - r.top) / r.height;
      setSlide(kind, o.min + Math.max(0, Math.min(1, p)) * (o.max - o.min));
    }
    tile.addEventListener('pointerdown', function (e) {
      dragging = true; fromPoint(e);
      if (tile.setPointerCapture && e.pointerId != null) { try { tile.setPointerCapture(e.pointerId); } catch (err) {} }
    });
    tile.addEventListener('pointermove', function (e) { if (dragging) fromPoint(e); });
    tile.addEventListener('pointerup', function () { dragging = false; });
    tile.addEventListener('pointercancel', function () { dragging = false; });
    if (inp) inp.addEventListener('input', function () { setSlide(kind, +inp.value); });
  });

  /* ─────────── brew timer ─────────── */
  (function timer() {
    var ring = $('#ringFg'), txt = $('#timerTxt'), st = $('#timerState');
    var start = $('#timerStart'), reset = $('#timerReset'), seg = $('#timerSeg');
    if (!ring || !txt) return;
    var C = 264, total = 155, left = 155, iv = null, name = 'v60';
    function fmt(s) { return Math.floor(s / 60) + ':' + pad(s % 60); }
    var ccName = $('#ccTimerName'), ccTime = $('#ccTimerTime'), ccRing = $('#ccRing');
    var ccPlay = $('#ccPlay'), ccPrev = $('#ccPrev'), ccNext = $('#ccNext');
    var PLAY = '<svg viewBox="0 0 24 24" width="17" height="17"><path d="M8.5 5.6 18 12l-9.5 6.4z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>';
    var PAUSE = '<svg viewBox="0 0 24 24" width="17" height="17"><path d="M9.5 5.5v13M14.5 5.5v13" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>';
    function paint() {
      txt.textContent = fmt(left);
      var off = String(C * (1 - (total - left) / total));
      ring.style.strokeDashoffset = off;
      if (ccTime) ccTime.textContent = fmt(left);
      set('#npPop', name + ' · ' + fmt(left));
      if (ccRing) ccRing.style.strokeDashoffset = off;
    }
    function stop(run) {
      clearInterval(iv); iv = null;
      start.textContent = run ? 'pause' : (left < total ? 'resume' : 'start');
      st.textContent = run ? 'pouring…' : (left <= 0 ? 'done' : 'paused');
      body.dataset.timer = run ? 'on' : 'off';
      if (ccPlay) { ccPlay.innerHTML = run ? PAUSE : PLAY; ccPlay.setAttribute('aria-label', run ? 'Pause brew timer' : 'Start brew timer'); }
      if (ccName) ccName.textContent = name;
    }
    segWire(seg, function (b) {
      total = left = +b.dataset.t; name = b.dataset.n;
      stop(false); st.textContent = 'ready'; start.textContent = 'start'; paint();
    });
    function stepPreset(d) {
      var bs = $$('#timerSeg button'), i = 0, j;
      for (j = 0; j < bs.length; j++) if (bs[j].classList.contains('is-on')) i = j;
      var n = bs[(i + d + bs.length) % bs.length];
      if (n) n.click();
    }
    if (ccPlay) ccPlay.addEventListener('click', function () { start.click(); });
    if (ccPrev) ccPrev.addEventListener('click', function () { stepPreset(-1); });
    if (ccNext) ccNext.addEventListener('click', function () { stepPreset(1); });
    start.addEventListener('click', function () {
      if (iv) { stop(false); return; }
      if (left <= 0) { left = total; }
      stop(true);
      iv = setInterval(function () {
        left--; paint();
        if (left <= 0) {
          stop(false); start.textContent = 'start'; st.textContent = 'done';
          Notify.push({ icon: 'timer', pane: 'y', title: name + ' is done', body: fmt(total) + ' total · start the next pour' });
        }
      }, 1000);
    });
    reset.addEventListener('click', function () { left = total; stop(false); st.textContent = 'ready'; start.textContent = 'start'; paint(); });
    stop(false); st.textContent = 'ready'; paint();
  })();

  /* ─────────── WINDOW MANAGER ─────────── */
  var WM = (function () {
    var list = [], shelf = $('#shelf'), sep = $('.dock__sep--shelf'), winList = $('#winList');

    function reg(el) {
      var w = { id: el.id, el: el, title: el.dataset.title || el.id, state: 'open', slot: null, flow: !el.classList.contains('win--float') && el.id !== 'assistant' };
      list.push(w);
      el.addEventListener('pointerdown', function () { focus(w); }, true);
      return w;
    }
    function find(id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }
    function focus(w) {
      list.forEach(function (o) { o.el.classList.toggle('is-focused', o === w && o.state === 'open'); });
    }
    function placeholder(w, kind) {
      if (!w.flow) return;
      if (w.slot) return;
      var d = document.createElement('div');
      d.className = 'winslot';
      d.innerHTML = '<b></b><button type="button">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15.5V4.6m0 0L8.2 8.4M12 4.6l3.8 3.8" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.5 15v3.2A1.8 1.8 0 0 0 6.3 20h11.4a1.8 1.8 0 0 0 1.8-1.8V15" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>' +
        '<span>restore</span></button>';
      $('b', d).textContent = w.title;
      $('button', d).title = 'Restore ' + w.title + ' (' + kind + ')';
      $('button', d).addEventListener('click', function () { restore(w.id); });
      w.el.insertAdjacentElement('afterend', d);
      w.slot = d;
    }
    function dropPlaceholder(w) { if (w.slot) { w.slot.remove(); w.slot = null; } }

    function setState(w, state) {
      w.state = state;
      w.el.classList.toggle('is-closed', state !== 'open');
      w.el.classList.toggle('is-min', state === 'min');
      if (state === 'open') { dropPlaceholder(w); w.el.classList.remove('is-min'); }
      refresh();
    }
    function close(id) {
      var w = find(id); if (!w || w.state === 'closed') return;
      if (w.id === 'assistant') Chat.toggle(false);
      placeholder(w, 'closed');
      setState(w, 'closed');
      Notify.push({ icon: 'window', pane: 'r', title: w.title + ' closed',
        action: { label: 'Restore', fn: function () { restore(id); } } });
    }
    function min(id) {
      var w = find(id); if (!w || w.state !== 'open') return;
      if (w.id === 'assistant') Chat.toggle(false);
      w.el.classList.add('is-min');
      placeholder(w, 'minimised');
      setTimeout(function () { setState(w, 'min'); }, reduce ? 0 : 380);
      Notify.push({ icon: 'window', pane: 'y', title: w.title + ' minimised',
        action: { label: 'Restore', fn: function () { restore(id); } } });
    }
    function restore(id) {
      var w = find(id); if (!w) return;
      dropPlaceholder(w);
      w.el.classList.remove('is-min');
      setState(w, 'open');
      focus(w);
      if (w.id === 'assistant') { Chat.toggle(true); return; }
      var r = w.el.getBoundingClientRect();
      if (r.top < 0 || r.bottom > window.innerHeight) {
        w.el.scrollIntoView({ behavior: S.motion === 'reduced' ? 'auto' : 'smooth', block: 'center' });
      }
      w.el.animate ? w.el.animate([{ opacity: .4, transform: 'scale(.985)' }, { opacity: 1, transform: 'none' }],
        { duration: reduce ? 1 : 320, easing: 'cubic-bezier(.22,.61,.36,1)' }) : null;
    }
    function restoreAll() {
      if (Sticky && Sticky.home) Sticky.home();
      var n = 0;
      list.forEach(function (w) { if (w.state !== 'open') { n++; restore(w.id); } });
      flash(n ? n + ' window' + (n > 1 ? 's' : '') + ' restored' : 'every window is already open');
    }
    function zoom(id) {
      var w = find(id); if (!w) return;
      w.el.classList.toggle('is-zoom');
      focus(w);
    }

    function refresh() {
      /* dock shelf */
      if (shelf) {
        shelf.innerHTML = '';
        var hidden = list.filter(function (w) { return w.state !== 'open'; });
        if (sep) sep.hidden = !hidden.length;
        hidden.forEach(function (w) {
          var b = document.createElement('button');
          b.className = 'dmin'; b.type = 'button'; b.setAttribute('aria-label', 'Restore ' + w.title);
          b.innerHTML = '<em></em><span class="dmin__tip"></span>';
          $('em', b).textContent = w.title;
          $('.dmin__tip', b).textContent = w.title + ' · ' + (w.state === 'min' ? 'minimised' : 'closed');
          b.addEventListener('click', function () { restore(w.id); });
          shelf.appendChild(b);
        });
      }
      /* Window menu */
      if (winList) {
        winList.innerHTML = '';
        list.forEach(function (w) {
          var b = document.createElement('button');
          b.className = 'menu__item'; b.type = 'button';
          var label = w.state === 'open' ? w.title : w.title + ' — ' + (w.state === 'min' ? 'minimised' : 'closed');
          b.innerHTML = '<span class="tick"></span><span></span>' + (w.state === 'open' ? '' : '<em>restore</em>');
          $('.tick', b).textContent = w.state === 'open' ? '✓' : '';
          $$('span', b)[1].textContent = label;
          b.addEventListener('click', function () {
            closeMenus();
            if (w.state === 'open') {
              focus(w);
              if (w.id === 'assistant') Chat.toggle(true);
              else w.el.scrollIntoView({ behavior: S.motion === 'reduced' ? 'auto' : 'smooth', block: 'center' });
            } else restore(w.id);
          });
          winList.appendChild(b);
        });
      }
    }

    /* traffic lights */
    document.addEventListener('click', function (e) {
      var tl = e.target.closest('.tl');
      if (!tl) return;
      var dlg = tl.closest('.dialog');
      if (dlg) { dlg.hidden = true; return; }
      var el = tl.closest('.win');
      if (!el) return;
      var w = find(el.id);
      if (!w) return;
      if (tl.dataset.tl === 'close' || tl.classList.contains('tl--r')) close(w.id);
      else if (tl.dataset.tl === 'min' || tl.classList.contains('tl--y')) min(w.id);
      else zoom(w.id);
    });
    /* stickies ✕ and any [data-close] */
    document.addEventListener('click', function (e) {
      var x = e.target.closest('[data-close]');
      if (!x) return;
      var el = x.closest('.win');
      if (el && find(el.id)) close(el.id);
    });

    /* scroll-driven focus: nearest window to viewport centre is "front" */
    var rafF = false;
    function scanFocus() {
      var mid = window.innerHeight / 2, best = null, bd = 1e9;
      list.forEach(function (w) {
        if (w.state !== 'open') return;
        var r = w.el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        var d = Math.abs(r.top + r.height / 2 - mid);
        if (d < bd) { bd = d; best = w; }
      });
      if (best) focus(best);
    }
    window.addEventListener('scroll', function () {
      if (rafF) return; rafF = true;
      requestAnimationFrame(function () { rafF = false; scanFocus(); });
    }, { passive: true });

    return { reg: reg, find: find, close: close, min: min, restore: restore, restoreAll: restoreAll,
      zoom: zoom, refresh: refresh, list: function () { return list; }, focus: focus, scan: scanFocus };
  })();

  $$('.win[data-title]').forEach(function (el) { if (el.id) WM.reg(el); });
  WM.refresh();
  setTimeout(function () { WM.scan(); }, 300);

  /* ─────────── menus ─────────── */
  var menubar = $('#menubar');
  function closeMenus() {
    $$('.menu').forEach(function (m) { m.classList.remove('is-open'); });
    $$('.mbtn[data-menu]').forEach(function (b) { b.classList.remove('is-open'); b.setAttribute('aria-expanded', 'false'); });
    menubar.classList.remove('menu-open');
  }
  function openMenu(btn, panel) {
    var r = btn.getBoundingClientRect();
    panel.style.left = Math.max(8, Math.min(r.left, window.innerWidth - 280)) + 'px';
    panel.classList.add('is-open'); btn.classList.add('is-open');
    btn.setAttribute('aria-expanded', 'true'); menubar.classList.add('menu-open');
  }
  $$('.mbtn[data-menu]').forEach(function (btn) {
    var panel = $('.menu[data-panel="' + btn.dataset.menu + '"]');
    if (!panel) return;
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var wasOpen = panel.classList.contains('is-open');
      closeMenus(); closeCC(); closeSpot(); hideCtx();
      if (!wasOpen) openMenu(btn, panel);
    });
    btn.addEventListener('mouseenter', function () { if (menubar.classList.contains('menu-open')) btn.click(); });
  });
  /* ─────────── control centre ─────────── */
  var cc = $('#cc');
  var ccButtons = [$('#ccBtn'), $('#mobileCcBtn')].filter(Boolean);
  function setCCOpen(open) {
    cc.classList.toggle('is-open', open);
    ccButtons.forEach(function (button) {
      button.setAttribute('aria-expanded', String(open));
      button.setAttribute('aria-label', open ? 'Close site controls' : 'Open site controls');
    });
  }
  function closeCC() { setCCOpen(false); }
  ccButtons.forEach(function (button) {
    button.addEventListener('click', function (e) {
      e.stopPropagation(); closeMenus(); closeSpot();
      setCCOpen(!cc.classList.contains('is-open'));
    });
  });
  var ccClose = $('#ccClose');
  if (ccClose) ccClose.addEventListener('click', closeCC);
  $$('.cc__phone-nav a,.cc__phone-tile--hire,.cc__phone-player > a').forEach(function (link) {
    link.addEventListener('click', closeCC);
  });
  $$('.sw').forEach(function (b) {
    b.addEventListener('click', function () { setAccent(b.dataset.setAccent); });
  });
  $$('.ccir[data-cc]').forEach(function (b) {
    b.addEventListener('click', function () {
      var k = b.dataset.cc;
      if (k === 'stars') S.stars = S.stars === 'on' ? 'off' : 'on';
      if (k === 'motion') S.motion = S.motion === 'reduced' ? 'full' : 'reduced';
      if (k === 'dock') S.dock = S.dock === 'on' ? 'off' : 'on';
      if (k === 'notifs') S.notifs = S.notifs === 'on' ? 'off' : 'on';
      save(); applyState();
    });
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.menu') && !e.target.closest('.mbtn[data-menu]')) closeMenus();
    if (!e.target.closest('.cc') && !e.target.closest('#ccBtn') && !e.target.closest('#mobileCcBtn')) closeCC();
    if (!e.target.closest('.menu--ctx')) hideCtx();
  });

  /* ─────────── shared actions ─────────── */
  function go(sel) { var el = $(sel); if (el) el.scrollIntoView({ behavior: S.motion === 'reduced' ? 'auto' : 'smooth', block: 'start' }); }
  function copy(text, okMsg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { flash(okMsg || 'copied'); }, function () { legacyCopy(text, okMsg); });
    } else legacyCopy(text, okMsg);
  }
  function legacyCopy(text, okMsg) {
    var ok = false;
    try {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
      document.body.appendChild(ta); ta.focus(); ta.select();
      ok = document.execCommand ? document.execCommand('copy') : false;
      ta.remove();
    } catch (e) {}
    flash(ok ? (okMsg || 'copied') : text);
  }
  function fullscreen() {
    if (!document.fullscreenElement) {
      if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
      flash('full screen — esc to exit');
    } else if (document.exitFullscreen) document.exitFullscreen();
  }

  var acts = {
    'about-mac': function () { $('#aboutMac').hidden = false; },
    'cc': function () { setCCOpen(true); },
    'spotlight': function () { openSpot(); },
    'restart': function () { try { sessionStorage.removeItem('wr-boot'); } catch (e) {} location.reload(); },
    'resume': function () {
      window.open('public/willson-rai-cv.pdf', '_blank');
      Notify.push({ icon: 'clip', pane: 'r', title: 'CV opened', body: 'willson-rai-cv.pdf — save it or print it from the viewer.' });
    },
    'print': function () { window.print(); },
    'copy-email': function () { copy(EMAIL, EMAIL + ' copied'); },
    'copy-phone': function () { copy(PHONE, PHONE + ' copied'); },
    'assistant': function () { Chat.toggle(true); },
    'fullscreen': fullscreen,
    'restore-all': function () { WM.restoreAll(); },
    'arrange': function () {
      Scatter.reset();
      $$('.win--float').forEach(function (w) {
        w.classList.remove('is-zoom', 'is-dragging');
        w.style.position = ''; w.style.left = ''; w.style.top = ''; w.style.right = ''; w.style.bottom = '';
        w.style.margin = ''; w.style.transform = ''; w.style.animation = '';
      });
      WM.restoreAll();
      flash('windows arranged');
    },
    'toggle-dock': function () { S.dock = S.dock === 'on' ? 'off' : 'on'; save(); applyState(); },
    'toggle-stars': function () { S.stars = S.stars === 'on' ? 'off' : 'on'; save(); applyState(); },
    'toggle-notifs': function () { S.notifs = S.notifs === 'on' ? 'off' : 'on'; save(); applyState(); flash('notifications ' + S.notifs); },
    'top': function () { window.scrollTo({ top: 0, behavior: S.motion === 'reduced' ? 'auto' : 'smooth' }); },
    'go-about': function () { go('#about'); },
    'go-trio': function () { go('#trio'); },
    'go-work': function () { go('#work'); },
    'go-services': function () { go('#services'); },
    'go-hire': function () { go('#hire'); },
    'go-creds': function () { go('#creds'); },
    'go-contact': function () { go('#contact'); setTimeout(function () { var n = $('#mName'); if (n) n.focus(); }, 700); }
  };
  document.addEventListener('click', function (e) {
    var it = e.target.closest('[data-act]');
    if (!it) return;
    closeMenus(); hideCtx();
    var fn = acts[it.dataset.act]; if (fn) fn();
  });

  /* ─────────── context menu ─────────── */
  var ctx = $('#ctx');
  function hideCtx() { ctx.classList.remove('is-open'); ctx.setAttribute('aria-hidden', 'true'); }
  function ctxItems(win) {
    var base = [];
    if (win) {
      base.push({ l: 'Bring to Front', a: function () { WM.restore(win.id); WM.focus(win); } });
      base.push({ l: 'Minimise', a: function () { WM.min(win.id); } });
      base.push({ l: 'Close', a: function () { WM.close(win.id); } });
      base.push({ sep: 1 });
    }
    base.push({ l: 'Restore All Windows', a: WM.restoreAll });
    base.push({ l: 'Spotlight Search', h: '⌘␣', a: openSpot });
    base.push({ l: 'Ask the Assistant', h: '⌘K', a: function () { Chat.toggle(true); } });
    base.push({ sep: 1 });
    base.push({ l: 'Download CV', h: '⌘S', a: acts.resume });
    base.push({ l: 'Copy Email', a: acts['copy-email'] });
    base.push({ l: 'Enter Full Screen', h: '⌃⌘F', a: fullscreen });
    return base;
  }
  document.addEventListener('contextmenu', function (e) {
    var t = e.target;
    if (!t || !t.closest || !t.tagName) return;
    if (/^(input|textarea)$/i.test(t.tagName)) return;
    if (t.closest('a')) return;
    e.preventDefault();
    var el = e.target.closest('.win');
    var win = el && el.id ? WM.find(el.id) : null;
    var items = ctxItems(win);
    ctx.innerHTML = '';
    items.forEach(function (it) {
      if (it.sep) { var s = document.createElement('div'); s.className = 'menu__sep'; ctx.appendChild(s); return; }
      var b = document.createElement('button');
      b.className = 'menu__item'; b.type = 'button';
      b.innerHTML = '<span></span>' + (it.h ? '<span class="menu__hint"></span>' : '');
      $('span', b).textContent = it.l;
      if (it.h) $('.menu__hint', b).textContent = it.h;
      b.addEventListener('click', function () { hideCtx(); it.a(); });
      ctx.appendChild(b);
    });
    closeMenus(); closeCC(); closeSpot();
    ctx.style.left = Math.min(e.clientX, window.innerWidth - 230) + 'px';
    ctx.style.top = Math.min(e.clientY, window.innerHeight - ctx.scrollHeight - 12) + 'px';
    ctx.classList.add('is-open'); ctx.setAttribute('aria-hidden', 'false');
  });

  /* ─────────── spotlight ─────────── */
  var SPOT = [
    { t: 'About', k: 'notes · who i am · bio · lalitpur', pane: 'y', act: function () { go('#about'); } },
    { t: 'The Brew Trio', k: 'craft · barista · espresso · bean · v60 · brewing', pane: 'b', act: function () { go('#trio'); } },
    { t: 'Work Experience', k: 'feels café · chaasuwa · jhamel beats · jobs', pane: 'b', act: function () { go('#work'); } },
    { t: 'Services', k: 'menu design · graphics · photography · videography', pane: 'p', act: function () { go('#services'); } },
    { t: 'Hire Me', k: 'consulting · training · events · guest barista', pane: 'a', act: function () { go('#hire'); } },
    { t: 'Credentials', k: 'mount strada · certification · college · see · skills', pane: 'd', act: function () { go('#creds'); } },
    { t: 'Contact', k: 'email · whatsapp · instagram · mail', pane: 'b', act: function () { go('#contact'); } },
    { t: 'Download CV', k: 'resume · pdf', pane: 'r', act: acts.resume, hint: 'pdf' },
    { t: 'Ask the Assistant', k: 'chat · messages · questions', pane: 'g', act: function () { Chat.toggle(true); }, hint: '⌘K' },
    { t: 'Ask: best v60 ratio?', k: 'brewing · recipe · water · grind', pane: 'g', act: function () { Chat.toggle(true); Chat.send('what is the best v60 ratio?'); } },
    { t: 'Ask: how do i dial in espresso?', k: 'shot · extraction · grinder', pane: 'g', act: function () { Chat.toggle(true); Chat.send('how do i dial in espresso?'); } },
    { t: 'Ask: can he train my team?', k: 'training · course · staff', pane: 'g', act: function () { Chat.toggle(true); Chat.send('can he train my barista team?'); } },
    { t: 'Restore All Windows', k: 'minimised · closed · dock · window menu', pane: 'y', act: function () { WM.restoreAll(); } },
    { t: 'Copy Email', k: EMAIL, pane: 'b', act: function () { copy(EMAIL, EMAIL + ' copied'); } },
    { t: 'WhatsApp', k: PHONE + ' · message', pane: 'g', act: function () { window.open('https://wa.me/9779765829096', '_blank'); } },
    { t: 'Instagram', k: '@willson_obito', pane: 'p', act: function () { window.open('https://www.instagram.com/willson_obito/', '_blank'); } },
    { t: 'GitHub', k: 'Willsonraiii · code', pane: 'd', act: function () { window.open('https://github.com/Willsonraiii', '_blank'); } },
    { t: 'Control Centre', k: 'accent · glass · starfield · motion · dock', pane: 'a', act: function () { setCCOpen(true); } },
    { t: 'Enter Full Screen', k: 'zoom · display', pane: 'd', act: fullscreen, hint: '⌃⌘F' }
  ];
  var spot = $('#spot'), spotInput = $('#spotInput'), spotList = $('#spotList'), sel = 0, results = [];
  function renderSpot(q) {
    q = (q || '').trim().toLowerCase();
    results = SPOT.filter(function (i) { return !q || (i.t + ' ' + i.k).toLowerCase().indexOf(q) > -1; });
    sel = 0;
    if (!results.length) { spotList.innerHTML = '<li class="spot__empty">no results</li>'; return; }
    spotList.innerHTML = results.map(function (r, i) {
      return '<li data-i="' + i + '" class="' + (i === 0 ? 'is-sel' : '') + '">' +
        '<span class="pane pane--' + r.pane + '"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="6.5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg></span>' +
        '<span>' + r.t + '</span>' + (r.hint ? '<small>' + r.hint + '</small>' : '') + '</li>';
    }).join('');
  }
  function moveSel(d) {
    if (!results.length) return;
    sel = (sel + d + results.length) % results.length;
    $$('li[data-i]', spotList).forEach(function (li, i) { li.classList.toggle('is-sel', i === sel); });
    var cur = $('li.is-sel', spotList); if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: 'nearest' });
  }
  var spotButtons = [$('#spotBtn')].filter(Boolean);
  function runSel() { var r = results[sel]; if (!r) return; closeSpot(); r.act(); }
  function openSpot() {
    closeMenus(); closeCC(); spot.hidden = false; spotInput.value = ''; renderSpot('');
    spotButtons.forEach(function (button) { button.setAttribute('aria-expanded', 'true'); });
    requestAnimationFrame(function () { spotInput.focus(); });
  }
  function closeSpot() {
    if (spot && !spot.hidden) spot.hidden = true;
    spotButtons.forEach(function (button) { button.setAttribute('aria-expanded', 'false'); });
  }
  spotButtons.forEach(function (button) {
    button.addEventListener('click', function (e) { e.stopPropagation(); openSpot(); });
  });
  spotInput.addEventListener('input', function () { renderSpot(spotInput.value); });
  spotInput.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); moveSel(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); moveSel(-1); }
    else if (e.key === 'Enter') { e.preventDefault(); runSel(); }
  });
  spotList.addEventListener('click', function (e) { var li = e.target.closest('li[data-i]'); if (!li) return; sel = +li.dataset.i; runSel(); });
  spot.addEventListener('click', function (e) { if (e.target === spot) closeSpot(); });

  /* ─────────── notes folders ─────────── */
  (function () {
    var win = $('#winNotes'); if (!win) return;
    var btns = $$('.vib__item[data-note]', win), notes = $$('.note[data-note]', win);
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        btns.forEach(function (x) { x.classList.toggle('is-active', x === b); });
        notes.forEach(function (n) { n.classList.toggle('is-on', n.dataset.note === b.dataset.note); });
      });
    });
  })();

  /* ─────────── hero terminal typing ─────────── */
  (function () {
    var box = $('#termBody'); if (!box) return;
    var L = [
      ['o', 'last login: Fri Oct  2 16:09:01 on ttys000'],
      ['p', 'willson@lalitpur ~ % whoami'],
      ['o', 'willson rai — barista & creative freelancer, lalitpur nepal'],
      ['p', 'willson@lalitpur ~ % cat now.txt'],
      ['o', 'seven years of coffee · 10k+ cups · menus, brand, photo, video'],
      ['p', 'willson@lalitpur ~ % open heywillson.app'],
      ['o', '✓ 21 windows loaded — scroll to explore']
    ];
    var caret = document.createElement('span'); caret.className = 'term__caret';
    function instant() {
      box.textContent = '';
      L.forEach(function (l) {
        var s = document.createElement('span'); s.className = l[0]; s.textContent = l[1] + '\n'; box.appendChild(s);
      });
      box.appendChild(caret);
    }
    if (S.motion === 'reduced' || mq('(max-width:760px)').matches) { instant(); return; }
    var li = 0, ci = 0, cur = null;
    (function tick() {
      if (li >= L.length) { box.appendChild(caret); return; }
      if (!cur) { cur = document.createElement('span'); cur.className = L[li][0]; box.appendChild(cur); }
      ci++;
      cur.textContent = L[li][1].slice(0, ci) + (ci < L[li][1].length ? '' : '\n');
      if (ci >= L[li][1].length) { li++; ci = 0; cur = null; setTimeout(tick, L[li - 1][0] === 'p' ? 260 : 120); return; }
      setTimeout(tick, 12 + Math.random() * 26);
    })();
  })();

  /* ─────────── dock ─────────── */
  $$('.dapp').forEach(function (app) {
    app.addEventListener('click', function () {
      app.classList.add('is-bounce');
      setTimeout(function () { app.classList.remove('is-bounce'); }, 520);
      if (app.dataset.open === 'assistant') Chat.toggle();
      else if (app.dataset.go) go(app.dataset.go);
    });
  });
  var dock = $('#dock');
  if (dock && !reduce && mq('(hover:hover)').matches) {
    dock.addEventListener('mousemove', function (e) {
      $$('.dapp', dock).forEach(function (a) {
        var r = a.getBoundingClientRect();
        var k = Math.max(0, 1 - Math.abs(e.clientX - (r.left + r.width / 2)) / 120);
        a.style.transform = 'scale(' + (1 + k * .2).toFixed(3) + ') translateY(' + (-k * 6).toFixed(2) + 'px)';
      });
    });
    dock.addEventListener('mouseleave', function () { $$('.dapp', dock).forEach(function (a) { a.style.transform = ''; }); });
  }
  if (!mq('(hover:hover)').matches) body.classList.add('dock-near');
  var dockT = null;
  function dockShow() { body.classList.add('dock-near'); if (dockT) { clearTimeout(dockT); dockT = null; } }
  function dockHideSoon() {
    if (dockT) clearTimeout(dockT);
    dockT = setTimeout(function () { body.classList.remove('dock-near'); }, 820);
  }
  window.addEventListener('pointermove', function (e) {
    if (S.dock !== 'on' || !dock) return;
    var r = dock.getBoundingClientRect();
    var over = e.clientX >= r.left - 10 && e.clientX <= r.right + 10 && e.clientY >= r.top - 10 && e.clientY <= r.bottom + 10;
    var near = e.clientY > window.innerHeight - 150;
    if (over || near) dockShow();
    else if (body.classList.contains('dock-near')) dockHideSoon();
  }, { passive: true });
  var shelfEl = $('#shelf');
  if (shelfEl && window.MutationObserver) {
    new MutationObserver(function () {
      body.classList.toggle('dock-has-shelf', !!shelfEl.children.length);
    }).observe(shelfEl, { childList: true });
    body.classList.toggle('dock-has-shelf', !!shelfEl.children.length);
  }
  var spy = new IntersectionObserver(function (es) {
    es.forEach(function (en) {
      if (!en.isIntersecting) return;
      var id = '#' + en.target.id;
      $$('.dapp[data-go]').forEach(function (a) { a.classList.toggle('is-running', a.dataset.go === id); });
    });
  }, { rootMargin: '-40% 0px -50% 0px' });
  ['about', 'trio', 'work', 'services', 'hire', 'creds', 'contact'].forEach(function (id) {
    var el = document.getElementById(id); if (el) spy.observe(el);
  });

  /* ─────────── drag ─────────── */
  var zTop = 40;
  function front(el) { zTop += 1; el.style.zIndex = zTop; }
  function draggable(el, handle, mode) {
    if (!handle) return;
    var sx, sy, ox, oy, dx = 0, dy = 0, drag = false;
    handle.addEventListener('pointerdown', function (e) {
      if (reduce) return;
      /* the phone rail is a scroll strip, not a drag surface */
      if (e.pointerType === 'touch' && el.closest && el.closest('.mobile-widget-rail')) return;
      if (e.target.closest('.tl') || e.target.closest('.win__x') || e.target.closest('button')) return;
      drag = true; front(el);
      var r = el.getBoundingClientRect();
      sx = e.clientX; sy = e.clientY;
      if (mode === 'shift') { dx = parseFloat(el.dataset.dx || 0); dy = parseFloat(el.dataset.dy || 0); }
      else {
        el.style.left = r.left + 'px'; el.style.top = r.top + 'px';
        el.style.position = 'fixed'; el.style.right = 'auto'; el.style.bottom = 'auto';
        el.style.margin = '0'; el.style.transform = 'none'; el.style.animation = 'none';
        ox = r.left; oy = r.top;
      }
      el.classList.add('is-dragging');
      try { handle.setPointerCapture(e.pointerId); } catch (err) {}
      e.preventDefault();
    });
    handle.addEventListener('pointermove', function (e) {
      if (!drag) return;
      if (mode === 'shift') {
        dx += e.movementX || 0; dy += e.movementY || 0;
        el.dataset.dx = dx; el.dataset.dy = dy;
        el.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px) scale(1.015)';
      } else {
        el.style.left = (ox + e.clientX - sx) + 'px';
        el.style.top = Math.max(34, oy + e.clientY - sy) + 'px';
      }
    });
    var end = function () {
      drag = false; el.classList.remove('is-dragging');
      if (mode === 'fixed') el.style.transform = '';
    };
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
    handle.addEventListener('lostpointercapture', end);
  }
  $$('.win--float').forEach(function (w) { draggable(w, $('.win__bar', w), 'fixed'); front(w); });
  $$('.win--scatter').forEach(function (w) { draggable(w, $('.win__bar', w), 'shift'); });
  draggable($('#assistant'), $('.win__bar', $('#assistant')), 'fixed');

  /* ─────────── scatter: click to front ─────────── */
  var Scatter = (function () {
    var wrap = $('#scatter');
    if (!wrap) return { reset: noop };
    var cards = $$('.win--scatter', wrap);
    var home = cards.map(function (c) { return c.getAttribute('style'); });
    cards.forEach(function (c) {
      c.addEventListener('click', function () {
        cards.forEach(function (o) { o.classList.remove('is-front'); });
        c.classList.add('is-front'); front(c);
      });
    });
    return { reset: function () {
      cards.forEach(function (c, i) {
        c.classList.remove('is-closed', 'is-min', 'is-front', 'is-dragging');
        c.setAttribute('style', home[i]);
        c.dataset.dx = 0; c.dataset.dy = 0;
      });
    } };
  })();
  var rs = $('#resetScatter'); if (rs) rs.addEventListener('click', function () { Scatter.reset(); WM.restoreAll(); });

  /* ─────────── finder ─────────── */
  function selectJob(n) {
    $$('.finder__item').forEach(function (o) { o.classList.toggle('is-active', o.dataset.job === n); });
    $$('.frow').forEach(function (o) { o.classList.toggle('is-sel', o.dataset.job === n); });
    $$('.job').forEach(function (j) { j.classList.toggle('is-open', j.dataset.jobPanel === n); });
    meters();
  }
  $$('.finder__item, .frow').forEach(function (b) {
    b.addEventListener('click', function () { selectJob(b.dataset.job); });
  });

  /* ─────────── settings ─────────── */
  $$('.set__item').forEach(function (b) {
    b.addEventListener('click', function () {
      $$('.set__item').forEach(function (o) { o.classList.remove('is-active'); });
      b.classList.add('is-active');
      $$('.set__panel').forEach(function (p) { p.classList.toggle('is-open', p.dataset.panel === b.dataset.tab); });
    });
  });
  var sSearch = $('#setSearch');
  if (sSearch) sSearch.addEventListener('input', function () {
    var q = sSearch.value.trim().toLowerCase(), first = null;
    $$('.set__item').forEach(function (b) {
      var hit = !q || b.textContent.toLowerCase().indexOf(q) > -1;
      b.hidden = !hit;
      if (hit && !first) first = b;
    });
    if (q && first && first.hidden === false && !first.classList.contains('is-active')) first.click();
  });

  /* ─────────── reveal + meters ─────────── */
  function meters() {
    $$('.bar').forEach(function (b) { if (b.getBoundingClientRect().top < window.innerHeight * .92) b.classList.add('in'); });
  }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { threshold: .14 });
  $$('.reveal').forEach(function (el) { io.observe(el); });
  window.addEventListener('scroll', meters, { passive: true });

  /* ─────────── parallax ─────────── */
  if (!reduce && mq('(hover:hover)').matches) {
    var floats = $$('.win--float'), nebs = $$('.nebula'), px = 0, py = 0, ticking = false;
    window.addEventListener('pointermove', function (e) {
      px = e.clientX / window.innerWidth - .5; py = e.clientY / window.innerHeight - .5;
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        floats.forEach(function (f, i) {
          if (f.classList.contains('is-dragging')) return;
          var k = (i + 1) * 6;
          f.style.translate = (px * k).toFixed(1) + 'px ' + (py * k).toFixed(1) + 'px';
        });
        nebs.forEach(function (n, i) { n.style.translate = (px * (i + 1) * -10).toFixed(1) + 'px ' + (py * (i + 1) * -8).toFixed(1) + 'px'; });
      });
    }, { passive: true });
  }

  /* ─────────── rating ─────────── */
  (function rate() {
    var wrap = $('#rateStars'), status = $('#rateStatus');
    if (!wrap) return;
    var btns = $$('button', wrap), val = 0;
    function paint(v) { btns.forEach(function (b, i) { b.classList.toggle('on', i < v); }); }
    btns.forEach(function (b) {
      b.addEventListener('mouseenter', function () { paint(+b.dataset.v); });
      b.addEventListener('click', function () {
        val = +b.dataset.v; paint(val);
        status.innerHTML = val + '/5 — <a href="mailto:' + EMAIL + '?subject=' +
          encodeURIComponent('Site review: ' + val + '/5 — willsonrai.com.np') + '&body=' +
          encodeURIComponent('Rating: ' + val + '/5\n\nFeedback: ') + '">send it to willson</a>';
      });
    });
    wrap.addEventListener('mouseleave', function () { paint(val); });
  })();

  /* ─────────── mail ─────────── */
  (function mail() {
    var f = $('#mailForm'), hint = $('#mailHint');
    if (!f) return;
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var n = $('#mName').value.trim(), em = $('#mEmail').value.trim(), m = $('#mMsg').value.trim();
      if (!n || !em || !m) { hint.textContent = 'name, email and message are needed'; return; }
      var sj = $('#mSubject'), sub = sj && sj.value.trim() ? sj.value.trim() : 'Portfolio enquiry';
      window.location.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(sub + ' — ' + n) +
        '&body=' + encodeURIComponent(m + '\n\n— ' + n + '\n' + em);
      hint.textContent = 'opening your mail app…';
      Notify.push({ icon: 'mail', pane: 'b', title: 'Draft ready in Mail', body: sub + ' — ' + n });
    });
  })();

  /* ─────────── messages (assistant) ─────────── */
  var Chat = (function () {
    var WORKER_URL = 'https://odd-lake-e6c5.matchahouse.workers.dev';
    var win = $('#assistant'), thread = $('#thread'), chips = $('#chips'), form = $('#chatForm'), input = $('#chatInput');
    var sendBtn = $('#chatSend'), stateEl = $('#chatState');
    var open = false, controller = null;

    function link(mode) {
      body.dataset.chat = mode;
      if (!stateEl) return;
      stateEl.textContent = mode === 'online' ? 'online' : mode === 'offline' ? 'offline · notes' : 'assistant';
    }
    function clockLabel() {
      var p = nptParts();
      return pad(p.h) + ':' + pad(p.m);
    }

    function stamp() {
      var p = nptParts();
      var s = $('#chatStamp');
      if (s) s.textContent = 'today ' + pad(p.h) + ':' + pad(p.m) + ' npt';
    }
    function bub(cls, txt) {
      var m = document.createElement('div');
      m.className = 'msg ' + cls;
      m.innerHTML = cls === 'msg--ai' ? '<span class="msg__av">WR</span><div class="msg__bub"></div>' : '<div class="msg__bub"></div>';
      var b = $('.msg__bub', m);
      b.textContent = txt || '';
      b.title = clockLabel();
      thread.appendChild(m);
      return b;
    }
    function delivered() {
      var d = document.createElement('span');
      d.className = 'delivered'; d.textContent = 'delivered';
      thread.appendChild(d);
    }
    function action(a) {
      if (!a || !a.href) return;
      var w = document.createElement('div'); w.className = 'msg--act';
      var l = document.createElement('a'); l.href = a.href; l.textContent = a.label || 'open';
      if (String(a.href).indexOf('http') === 0) { l.target = '_blank'; l.rel = 'noopener'; }
      w.appendChild(l); thread.appendChild(w);
    }
    function scroll() { thread.scrollTop = thread.scrollHeight; }
    function setChips(list) {
      chips.innerHTML = '';
      (list || []).slice(0, 4).forEach(function (q) {
        var b = document.createElement('button'); b.type = 'button'; b.textContent = q; b.dataset.q = q;
        chips.appendChild(b);
      });
    }
    function toggle(force) {
      open = typeof force === 'boolean' ? force : !open;
      win.hidden = false;
      requestAnimationFrame(function () { win.classList.toggle('is-open', open); });
      var d = $('.dapp[data-open="assistant"]'); if (d) d.classList.toggle('is-running', open);
      if (open) {
        front(win); WM.focus(WM.find('assistant')); stamp();
        setTimeout(function () { input.focus(); scroll(); syncSend(); }, 240);
      }
    }

    var LOCAL = [
      { k: ['hire', 'hiring', 'book', 'job', 'freelance'], a: 'he takes café consulting, menu design, branding, photography and barista training. whatsapp is the fastest way to reach him.', act: { label: 'message on whatsapp', href: 'https://wa.me/9779765829096' } },
      { k: ['cv', 'resume', 'download'], a: 'here is the full cv — seven years across three venues.', act: { label: 'download cv (pdf)', href: 'public/willson-rai-cv.pdf' } },
      { k: ['do', 'who', 'about', 'barista'], a: 'willson rai is a barista and creative freelancer in lalitpur, doing menus, graphics, photo and video for hospitality brands.' },
      { k: ['v60', 'ratio', 'brew', 'recipe'], a: 'v60 baseline: 15g coffee to 250g water (1:16.6), 94°c, medium-fine. bloom with 45g for 40s, then pour in two stages and finish around 2:30–2:45. taste first, adjust grind second.' },
      { k: ['espresso', 'shot', 'dial'], a: 'dial in at 18g in, 36g out, 25–30s. sour means grind finer, bitter means coarser. change one variable at a time and taste.' },
      { k: ['latte', 'art', 'milk'], a: 'steam to 60–65°c, stretch 3–4 seconds until it sounds like tearing paper, swirl until glossy. pour from height to sink the milk, then drop low to draw.' },
      { k: ['menu', 'design', 'brand', 'photo', 'video'], a: 'menus, promo graphics, branding, beverage photography and short-form video — all done in-house for cafés and restaurants.', act: { label: 'see services', href: '#services' } },
      { k: ['training', 'teach', 'class', 'course', 'team'], a: 'he runs one-on-one and group training: espresso theory, milk texturing, latte art, manual brewing and guest interaction.', act: { label: 'request a session', href: 'mailto:' + EMAIL + '?subject=Barista%20training' } },
      { k: ['contact', 'email', 'phone', 'whatsapp', 'instagram'], a: 'fastest route is whatsapp — he replies between shifts.', act: { label: 'open whatsapp', href: 'https://wa.me/9779765829096' } },
      { k: ['price', 'cost', 'rate', 'charge'], a: 'rates depend on scope — training days, menu projects or event pop-ups. send the details on whatsapp for a real number.' },
      { k: ['chemex', 'filter', 'pour over'], a: 'chemex: 30g coffee, 500g water, 94°c, coarse-ish grind. bloom with 60g for 45s, then three pours to finish near 4:00.', sug: ['best v60 ratio?', 'how do i dial in espresso?'] },
      { k: ['hours', 'shift', 'available', 'when'], a: 'he works shifts and fits freelance work around them — mornings are best for a call.', act: { label: 'message on whatsapp', href: 'https://wa.me/9779765829096' }, sug: ['how can i hire him?', 'what does he do?'] }
    ];
    var NOMATCH = {
      a: 'that one is not in the notes. ratios, hiring, menus, training and the cv all work — or send the question straight to willson.',
      act: { label: 'message willson', href: 'https://wa.me/9779765829096' },
      sug: ['what does he do?', 'best v60 ratio?', 'how can i hire him?', 'send me the cv']
    };
    function local(q) {
      var t = ' ' + q.toLowerCase().replace(/[^a-z0-9]+/g, ' ') + ' ';
      var best = null, bestLen = 0;
      for (var i = 0; i < LOCAL.length; i++) {
        for (var j = 0; j < LOCAL[i].k.length; j++) {
          var k = LOCAL[i].k[j];
          /* whole-word match, longest keyword wins: "dial in espresso" must not fall into "do" */
          if (t.indexOf(' ' + k + ' ') > -1 && k.length > bestLen) { best = LOCAL[i]; bestLen = k.length; }
        }
      }
      return best || NOMATCH;
    }
    function history() {
      return $$('.msg__bub', thread).slice(-8).map(function (b) {
        var t = (b.innerText || b.textContent || '').trim();
        return { role: b.closest('.msg--me') ? 'user' : 'assistant', content: t.slice(0, 700) };
      }).filter(function (h) { return h.content; });
    }
    function type(el, parts, act, sug) {
      var i = 0;
      function next() {
        if (i >= parts.length) { action(act); if (sug && sug.length) setChips(sug); scroll(); return; }
        var p = document.createElement('p'); p.style.margin = i ? '7px 0 0' : '0'; el.appendChild(p);
        var txt = String(parts[i++] || ''), n = 0;
        var iv = setInterval(function () {
          p.textContent = txt.slice(0, ++n); scroll();
          if (n >= txt.length) { clearInterval(iv); setTimeout(next, 90); }
        }, reduce ? 0 : 12);
      }
      next();
    }
    function send(text) {
      text = String(text || '').trim();
      if (!text) return;
      if (!open) toggle(true);
      bub('msg--me', text); delivered();
      input.value = ''; syncSend();
      var hist = history().slice(0, -1);
      var b = bub('msg--ai', '');
      b.innerHTML = '<span class="typing"><i></i><i></i><i></i></span>';
      scroll();
      if (controller) controller.abort();
      controller = new AbortController();
      var to = setTimeout(function () { controller.abort(); }, 9000);
      fetch(WORKER_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: hist }), signal: controller.signal
      })
        .then(function (r) { if (!r.ok) throw new Error('no backend'); return r.json(); })
        .then(function (d) {
          var parts = d && d.reply ? String(d.reply).split(/\n\n+/) : null;
          var sug = (d && d.suggestions && d.suggestions.length) ? d.suggestions : null;
          var l = local(text);
          b.innerHTML = '';
          link('online');
          type(b, parts || [l.a], (d && d.action) || l.act, sug || l.sug);
        })
        .catch(function () {
          var l = local(text);
          b.innerHTML = '';
          link('offline');
          type(b, [l.a], l.act, l.sug);
        })
        .finally(function () { clearTimeout(to); });
    }

    function syncSend() { if (sendBtn) sendBtn.disabled = !input.value.trim(); }
    input.addEventListener('input', syncSend);
    form.addEventListener('submit', function (e) { e.preventDefault(); send(input.value); syncSend(); });
    chips.addEventListener('click', function (e) { var b = e.target.closest('button[data-q]'); if (b) send(b.dataset.q); });
    link('');
    return { toggle: toggle, send: send };
  })();

  /* ─────────── keyboard ─────────── */
  var dlgEl = $('#aboutMac');
  document.addEventListener('keydown', function (e) {
    var k = e.key.toLowerCase();
    var typing = /^(input|textarea)$/i.test((e.target.tagName || ''));
    if ((e.metaKey || e.ctrlKey) && e.code === 'Space') { e.preventDefault(); openSpot(); return; }
    if ((e.metaKey || e.ctrlKey) && k === 'k') { e.preventDefault(); Chat.toggle(true); return; }
    if ((e.metaKey || e.ctrlKey) && k === 's' && !typing) { e.preventDefault(); acts.resume(); return; }
    if ((e.metaKey || e.ctrlKey) && e.ctrlKey && k === 'f') { e.preventDefault(); fullscreen(); return; }
    if (k === 'escape') {
      hideCtx();
      if (!spot.hidden) { closeSpot(); return; }
      if (dlgEl && !dlgEl.hidden) { dlgEl.hidden = true; return; }
      var z = $('.win.is-zoom'); if (z) { z.classList.remove('is-zoom'); return; }
      closeMenus(); closeCC();
      return;
    }
    if (k === '/' && !typing && spot.hidden) { e.preventDefault(); openSpot(); }
  });
  if (dlgEl) dlgEl.addEventListener('click', function (e) { if (e.target === dlgEl) dlgEl.hidden = true; });
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-close-dialog]') && dlgEl) dlgEl.hidden = true;
  });

  /* ─────────── boot ─────────── */
  function boot() {
    var el = $('#boot'), fill = $('#bootFill');
    if (!el || document.documentElement.classList.contains('no-boot') || mq('(max-width:760px)').matches) { if (el) el.remove(); return; }
    var p = 0;
    var tick = setInterval(function () {
      p = Math.min(100, p + 8 + Math.random() * 14);
      fill.style.transform = 'scaleX(' + (p / 100) + ')';
      if (p >= 100) {
        clearInterval(tick);
        setTimeout(function () {
          body.classList.add('booted');
          try { sessionStorage.setItem('wr-boot', '1'); } catch (e2) {}
          setTimeout(function () { el.remove(); }, 500);
        }, 220);
      }
    }, 95);
    el.addEventListener('click', function () { clearInterval(tick); body.classList.add('booted'); el.remove(); });
  }

  /* ─────────── the desk sticky note: quick launch for the three clips ─────────── */
  var Sticky = (function () {
    var el = $('#winStickies');
    if (!el) return { home: noop };
    var body = $('.win__body', el);
    var HOME = el.getAttribute('style') || '';
    /* "Restore All Windows" also puts a dragged note back on the desk */
    function home() {
      el.setAttribute('style', HOME);
      el.dataset.dx = 0; el.dataset.dy = 0;
    }
    if (body) {
      var pills = document.createElement('div');
      pills.className = 'sticky-pills';
      pills.setAttribute('role', 'group');
      pills.setAttribute('aria-label', 'Play a clip from the note');
      [['latte', 'latte art'], ['beans', 'beans fall'], ['reel', 'v60 pour']].forEach(function (clip) {
        var b = document.createElement('button');
        b.type = 'button';
        b.dataset.stickyClip = clip[0];
        b.textContent = clip[1];
        b.setAttribute('aria-label', 'Play the ' + clip[1] + ' clip');
        pills.appendChild(b);
      });
      pills.addEventListener('click', function (e) {
        var b = e.target.closest('button[data-sticky-clip]');
        if (!b) return;
        var pair = { latte: ['#latteVid', '#frameCta'], beans: ['#beansVid', '#beansCta'], reel: ['#reelVid', '#reelCta'] }[b.dataset.stickyClip];
        var vid = $(pair[0]), cta = $(pair[1]);
        if (!vid) return;
        if (vid.paused || vid.ended) { if (cta) cta.click(); else vid.play(); }
        if (vid.scrollIntoView) vid.scrollIntoView({ behavior: S.motion === 'reduced' ? 'auto' : 'smooth', block: 'center' });
      });
      body.appendChild(pills);
    }
    return { home: home };
  })();

  /* ─────────── phone layout: move the three desk widgets out of the hero ─────────── */
  (function placeMobileWidgets() {
    var rail = $('#mobileWidgetRail');
    if (!rail) return;
    var items = ['#winClock', '#winTimer', '#winStickies'].map(function (sel) {
      return { el: $(sel), marker: null };
    }).filter(function (item) { return item.el; });
    var media = mq('(max-width:760px)');
    function sync() {
      if (media.matches) {
        items.forEach(function (item) {
          if (!item.marker || !item.marker.parentNode) {
            item.marker = document.createComment('desktop widget position');
            item.el.parentNode.insertBefore(item.marker, item.el);
          }
          rail.appendChild(item.el);
        });
      } else {
        items.forEach(function (item) {
          if (item.marker && item.marker.parentNode) {
            item.marker.parentNode.insertBefore(item.el, item.marker.nextSibling);
            item.marker.parentNode.removeChild(item.marker);
            item.marker = null;
          }
        });
      }
    }
    sync();
    if (media.addEventListener) media.addEventListener('change', sync);
    else if (media.addListener) media.addListener(sync);
  })();

  /* ─────────── init ─────────── */
  applyState();
  $$('.win--float').forEach(function (w) { w.dataset.home = w.getAttribute('style') || ''; });
  setTimeout(function () { meters(); segPaint($('#timerSeg')); paintSlide('glass'); paintSlide('stars'); }, 700);
  boot();

})();
