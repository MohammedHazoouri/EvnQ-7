/* A Night Written in Stars — cinematic wedding invitation */
(function () {
  'use strict';

  var C = window.WEDDING_CONFIG || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function (v, a, b) { return Math.max(a === undefined ? 0 : a, Math.min(b === undefined ? 1 : b, v)); };
  var ease = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

  /* ───────── Bind editable content ───────── */
  var dateObj = new Date(C.dateISO);
  function fmt(opts) {
    try {
      return new Intl.DateTimeFormat('en-US', Object.assign({ timeZone: C.timezone || undefined }, opts)).format(dateObj);
    } catch (e) {
      return new Intl.DateTimeFormat('en-US', opts).format(dateObj);
    }
  }
  var binds = {
    bride: C.bride, groom: C.groom, couple: C.bride + ' & ' + C.groom,
    weekday: fmt({ weekday: 'long' }),
    dateLong: fmt({ month: 'long', day: 'numeric', year: 'numeric' }),
    time: fmt({ hour: 'numeric', minute: '2-digit' }),
    venue: C.venue, address: C.address, mystery: C.mystery, kicker: C.kicker, lead: C.lead,
    subtitle: C.subtitle, welcome: C.welcome, detailsNote: C.detailsNote,
    countdownTitle: C.countdownTitle, celebration: C.celebration, closing: C.closing
  };
  $$('[data-bind]').forEach(function (el) {
    var k = el.getAttribute('data-bind');
    if (binds[k] !== undefined) el.textContent = binds[k];
  });
  var namesEl = $('.names');
  if (namesEl) namesEl.setAttribute('aria-label', C.bride + ' and ' + C.groom);
  document.title = C.bride + ' & ' + C.groom + ' — A Night Written in Stars';
  var mapBtn = $('#mapBtn');
  if (mapBtn) mapBtn.href = C.mapUrl || '#';

  /* ───────── Canvases ───────── */
  var sky = $('#sky'), g = sky.getContext('2d');
  var fxc = $('#fx'), f = fxc.getContext('2d');
  var W = 0, H = 0, DPR = 1;
  var stars = [];
  var heartPts = [];
  var P = [[0, 0], [0, 0], [0, 0], [0, 0]];

  var glow = document.createElement('canvas');
  glow.width = glow.height = 64;
  (function () {
    var c = glow.getContext('2d');
    var gr = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,246,208,1)');
    gr.addColorStop(.25, 'rgba(246,208,104,.85)');
    gr.addColorStop(1, 'rgba(212,175,55,0)');
    c.fillStyle = gr;
    c.fillRect(0, 0, 64, 64);
  })();

  function heartXY(t) {
    return [16 * Math.pow(Math.sin(t), 3),
      -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))];
  }

  function buildHearts() {
    var small = W < 600;
    var cx = W / 2, cy = H * (small ? 0.30 : 0.34);
    var s = Math.min(W, H) * (small ? 0.011 : 0.0105);
    var N = 64;
    heartPts = [];
    for (var h = 0; h < 2; h++) {
      var dir = h ? 1 : -1, ox = dir * s * 7, rot = dir * 0.22;
      for (var i = 0; i < N; i++) {
        var xy = heartXY(i / N * Math.PI * 2);
        var rx = xy[0] * Math.cos(rot) - xy[1] * Math.sin(rot);
        var ry = xy[0] * Math.sin(rot) + xy[1] * Math.cos(rot);
        heartPts.push({ tx: cx + ox + rx * s, ty: cy + ry * s, ph: Math.random() * 6.28 });
      }
    }
    heartPts.forEach(function (p, i) { p.i = i; });
    P = [[-30, H * 0.86], [W * 0.22, H * 0.08], [W * 0.66, H * 0.72], [cx, cy]];
  }

  function bez(t) {
    var u = 1 - t, a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
    return [a * P[0][0] + b * P[1][0] + c * P[2][0] + d * P[3][0],
      a * P[0][1] + b * P[1][1] + c * P[2][1] + d * P[3][1]];
  }

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    [[sky, g], [fxc, f]].forEach(function (pair) {
      pair[0].width = Math.round(W * DPR); pair[0].height = Math.round(H * DPR);
      pair[1].setTransform(DPR, 0, 0, DPR, 0, 0);
    });
    var n = Math.max(60, Math.min(220, Math.round(W * H / 7000)));
    stars = [];
    for (var i = 0; i < n; i++) {
      stars.push({
        x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.4 + .3,
        ph: Math.random() * 6.28, sp: .6 + Math.random() * 1.6,
        vx: (Math.random() - .5) * 4, vy: (Math.random() - .5) * 2
      });
    }
    buildHearts();
  }

  /* ───────── State ───────── */
  var mode = 'intro';           // intro → converge → invite
  var T0 = performance.now() - (reduce ? 12000 : 0);
  var convStart = 0;
  var last = performance.now();

  /* Particles (gold dust) */
  var parts = [];
  function spawn(x, y, vx, vy, life, size) {
    if (parts.length > 200) parts.shift();
    parts.push({ x: x, y: y, vx: vx, vy: vy, life: life, max: life, s: size });
  }
  function burst(x, y, n, speed) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, v = (.3 + Math.random()) * speed;
      spawn(x, y, Math.cos(a) * v, Math.sin(a) * v, 1 + Math.random() * 1.2, 6 + Math.random() * 10);
    }
  }

  function drawStars(t, dt) {
    var cx = W / 2, cy = H / 2;
    var e = mode === 'converge' ? ease(clamp((performance.now() - convStart) / 1500)) : 0;
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      if (!reduce) {
        s.x += s.vx * dt; s.y += s.vy * dt;
        if (s.x < -5) s.x = W + 5; else if (s.x > W + 5) s.x = -5;
        if (s.y < -5) s.y = H + 5; else if (s.y > H + 5) s.y = -5;
      }
      var tw = reduce ? .8 : .55 + .45 * Math.sin(t * s.sp + s.ph);
      var x = s.x + (cx - s.x) * e, y = s.y + (cy - s.y) * e;
      g.globalAlpha = tw * (mode === 'invite' ? .8 : 1);
      g.fillStyle = '#fff6dc';
      g.beginPath(); g.arc(x, y, s.r, 0, 6.2832); g.fill();
      if (s.r > 1.3) { g.globalAlpha = tw * .35; g.drawImage(glow, x - 7, y - 7, 14, 14); }
    }
    g.globalAlpha = 1;
  }

  function drawIntro(now) {
    var T = (now - T0) / 1000;
    var cx = W / 2, cy = H / 2;
    var e = mode === 'converge' ? ease(clamp((now - convStart) / 1500)) : 0;

    // Golden path
    var pp = ease(clamp((T - .6) / 2.6));
    var lineA = 1 - clamp((T - 3.4) / 1.2);
    if (mode === 'intro' && pp > 0 && lineA > 0) {
      g.save();
      g.lineWidth = 2; g.lineCap = 'round';
      g.strokeStyle = 'rgba(246,222,130,' + (.85 * lineA).toFixed(3) + ')';
      g.shadowColor = '#f6d778'; g.shadowBlur = 12;
      g.beginPath();
      var steps = 70;
      for (var k = 0; k <= steps; k++) {
        var pt = bez(pp * k / steps);
        if (k === 0) g.moveTo(pt[0], pt[1]); else g.lineTo(pt[0], pt[1]);
      }
      g.stroke();
      g.restore();
      var tip = bez(pp);
      g.globalAlpha = lineA;
      g.drawImage(glow, tip[0] - 16, tip[1] - 16, 32, 32);
      g.globalAlpha = 1;
    }

    // Light points gathering into two interlocking hearts
    var total = heartPts.length;
    for (var j = 0; j < total; j++) {
      var p = heartPts[j];
      var u = .04 + .92 * p.i / total;
      if (pp < u) continue;
      var sp = bez(u);
      var gs = 3.0 + (p.i / total) * 1.2;
      var kk = ease(clamp((T - gs) / 1.4));
      var x = sp[0] + (p.tx - sp[0]) * kk;
      var y = sp[1] + (p.ty - sp[1]) * kk;
      var pulse = Math.sin(T * 2 + p.ph);
      var a = reduce ? .9 : .65 + .35 * pulse;
      var r = kk < 1 ? 5 : 6 + (reduce ? 0 : pulse * 2);
      if (e > 0) { x += (cx - x) * e; y += (cy - y) * e; r *= (1 - .4 * e); }
      g.globalAlpha = a;
      g.drawImage(glow, x - r * 2, y - r * 2, r * 4, r * 4);
    }
    g.globalAlpha = 1;

    if (e > 0) {
      var R = 30 + e * 170;
      g.globalAlpha = e;
      g.drawImage(glow, cx - R, cy - R, R * 2, R * 2);
      g.globalAlpha = 1;
    }
  }

  function drawFx(dt) {
    f.clearRect(0, 0, W, H);
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.life -= dt;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 26 * dt; p.vx *= .99;
      f.globalAlpha = clamp(p.life / p.max) * .95;
      f.drawImage(glow, p.x - p.s, p.y - p.s, p.s * 2, p.s * 2);
    }
    f.globalAlpha = 1;
  }

  function frame(now) {
    var dt = Math.min(.05, (now - last) / 1000);
    last = now;
    g.clearRect(0, 0, W, H);
    drawStars(now / 1000, dt);
    if (mode !== 'invite') drawIntro(now);
    if (!reduce) drawFx(dt);
    requestAnimationFrame(frame);
  }

  /* ───────── Sound (soft built-in music, or your own file) ───────── */
  var soundOn = false, actx = null, master = null, timer = null, audioEl = null;
  var scale = [587.33, 659.25, 739.99, 880, 987.77, 1108.73, 1174.66];

  function ensureAudio() {
    if (C.musicFile) {
      if (!audioEl) { audioEl = new Audio(C.musicFile); audioEl.loop = true; audioEl.volume = .55; }
      return;
    }
    if (actx) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    actx = new AC();
    master = actx.createGain();
    master.gain.value = 0;
    master.connect(actx.destination);
    var lp = actx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 900; lp.connect(master);
    [146.83, 220, 293.66, 369.99].forEach(function (fr, i) {
      var o = actx.createOscillator(); o.type = 'sine'; o.frequency.value = fr; o.detune.value = (i - 1.5) * 4;
      var gn = actx.createGain(); gn.gain.value = .05;
      o.connect(gn); gn.connect(lp); o.start();
      var lfo = actx.createOscillator(); lfo.frequency.value = .07 + i * .03;
      var lg = actx.createGain(); lg.gain.value = .03;
      lfo.connect(lg); lg.connect(gn.gain); lfo.start();
    });
  }
  function note(freq, when, dur, vol) {
    var o = actx.createOscillator(), gn = actx.createGain();
    o.type = 'triangle'; o.frequency.value = freq;
    gn.gain.setValueAtTime(0, when);
    gn.gain.linearRampToValueAtTime(vol, when + .02);
    gn.gain.exponentialRampToValueAtTime(.0001, when + dur);
    o.connect(gn); gn.connect(master);
    o.start(when); o.stop(when + dur + .05);
  }
  function chime() {
    if (!soundOn || !actx || C.musicFile) return;
    var t = actx.currentTime;
    [1174.66, 1480, 1760].forEach(function (fr, i) { note(fr, t + i * .12, 2.2, .1); });
  }
  function setSound(on) {
    soundOn = on;
    var btn = $('#musicBtn');
    if (btn) btn.setAttribute('aria-pressed', String(on));
    ensureAudio();
    if (C.musicFile) {
      if (!audioEl) return;
      if (on) { var pr = audioEl.play(); if (pr && pr.catch) pr.catch(function () {}); } else audioEl.pause();
      return;
    }
    if (!actx) return;
    if (on) {
      actx.resume();
      master.gain.cancelScheduledValues(actx.currentTime);
      master.gain.linearRampToValueAtTime(.9, actx.currentTime + 2);
      clearInterval(timer);
      timer = setInterval(function () {
        if (!soundOn) return;
        var t = actx.currentTime;
        note(scale[Math.floor(Math.random() * scale.length)], t, 2.6, .08);
        if (Math.random() < .4) note(scale[Math.floor(Math.random() * scale.length)], t + .35, 2, .05);
      }, 1800);
    } else {
      master.gain.cancelScheduledValues(actx.currentTime);
      master.gain.linearRampToValueAtTime(0, actx.currentTime + .6);
      clearInterval(timer);
    }
  }
  $('#musicBtn').addEventListener('click', function () { setSound(!soundOn); });

  /* ───────── Intro timeline ───────── */
  var intro = $('#intro'), wave = $('#wave'), invite = $('#invite');
  var mystery = $('#mystery'), discover = $('#discover');
  setTimeout(function () { mystery.classList.add('show'); }, reduce ? 0 : 4300);
  setTimeout(function () { discover.classList.add('show'); }, reduce ? 0 : 5600);

  function reveal() {
    mode = 'invite';
    intro.style.display = 'none';
    document.body.classList.remove('locked', 'converge');
    invite.classList.remove('hidden');
    invite.classList.add('show');
    window.scrollTo(0, 0);
    wave.classList.add('fade');
    setTimeout(function () { wave.style.display = 'none'; }, 1800);
    if (!reduce) burst(W / 2, H * .3, 40, 120);
    chime();
    observe();
  }

  discover.addEventListener('click', function () {
    if (mode !== 'intro') return;
    mode = 'converge';
    convStart = performance.now();
    document.body.classList.add('converge');
    intro.classList.add('leaving');
    if (C.autoplayMusic !== false) setSound(true);
    chime();
    setTimeout(function () { wave.classList.add('go'); }, reduce ? 0 : 1100);
    setTimeout(reveal, reduce ? 60 : 2100);
  });

  /* ───────── Scroll reveal ───────── */
  var io = null;
  function observe() {
    var els = $$('.reveal, .rings');
    if (!('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('in'); }); return; }
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          if (en.target.classList.contains('count') && cdFinished && !cdBurst) celebrate();
          io.unobserve(en.target);
        }
      });
    }, { threshold: .18, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ───────── Gold dust on pointer / scroll ───────── */
  var lastMove = 0;
  window.addEventListener('pointermove', function (e) {
    if (reduce || mode === 'converge') return;
    var now = performance.now();
    if (now - lastMove < 45) return;
    lastMove = now;
    spawn(e.clientX + (Math.random() - .5) * 8, e.clientY + (Math.random() - .5) * 8,
      (Math.random() - .5) * 30, -10 - Math.random() * 25, .9 + Math.random() * .6, 5 + Math.random() * 6);
  }, { passive: true });
  window.addEventListener('pointerdown', function (e) {
    if (reduce || mode !== 'invite') return;
    burst(e.clientX, e.clientY, 10, 70);
  }, { passive: true });

  var lastY = window.scrollY;
  window.addEventListener('scroll', function () {
    var dy = window.scrollY - lastY;
    lastY = window.scrollY;
    if (reduce || mode !== 'invite') return;
    var n = Math.min(6, Math.floor(Math.abs(dy) / 14));
    for (var i = 0; i < n; i++) {
      var left = Math.random() < .5;
      var x = left ? Math.random() * W * .16 : W - Math.random() * W * .16;
      spawn(x, Math.random() * H, (Math.random() - .5) * 20, (dy > 0 ? -1 : 1) * (20 + Math.random() * 40), 1.2 + Math.random(), 5 + Math.random() * 8);
    }
  }, { passive: true });

  /* ───────── Countdown ───────── */
  var cdFinished = false, cdBurst = false, cdTimer = null;
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  function celebrate() {
    cdBurst = true;
    if (reduce) return;
    var rounds = 0;
    var id = setInterval(function () {
      burst(W * (.2 + Math.random() * .6), H * (.2 + Math.random() * .4), 34, 150);
      if (++rounds > 5) clearInterval(id);
    }, 450);
  }
  function tick() {
    var diff = dateObj.getTime() - Date.now();
    if (isNaN(diff)) { clearInterval(cdTimer); return; }
    if (diff <= 0) {
      cdFinished = true;
      $('#cdBox').hidden = true;
      $('#cdDone').hidden = false;
      clearInterval(cdTimer);
      var sec = $('.count');
      if (sec && sec.classList.contains('in') && !cdBurst) celebrate();
      return;
    }
    var s = Math.floor(diff / 1000);
    $('#cd-d').textContent = pad(Math.floor(s / 86400));
    $('#cd-h').textContent = pad(Math.floor(s % 86400 / 3600));
    $('#cd-m').textContent = pad(Math.floor(s % 3600 / 60));
    $('#cd-s').textContent = pad(s % 60);
  }
  tick();
  cdTimer = setInterval(tick, 1000);

  /* ───────── Calendar ───────── */
  function icsEsc(s) { return String(s || '').replace(/[\\;,]/g, '\\$&').replace(/\n/g, '\\n'); }
  function icsDate(d) { return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); }
  var endObj = new Date(dateObj.getTime() + (C.durationHours || 4) * 3600000);
  var title = C.bride + ' & ' + C.groom + ' — Wedding';
  var place = C.venue + ', ' + C.address;

  var gcal = $('#gcalBtn');
  if (gcal && !isNaN(dateObj.getTime())) {
    gcal.href = 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
      '&text=' + encodeURIComponent(title) +
      '&dates=' + icsDate(dateObj) + '/' + icsDate(endObj) +
      '&location=' + encodeURIComponent(place) +
      '&details=' + encodeURIComponent(C.calendarNote || '');
  }
  $('#calBtn').addEventListener('click', function () {
    if (isNaN(dateObj.getTime())) return;
    var ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//EvnQ//Wedding Invitation//EN', 'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT', 'UID:' + Date.now() + '@evnq-invitation', 'DTSTAMP:' + icsDate(new Date()),
      'DTSTART:' + icsDate(dateObj), 'DTEND:' + icsDate(endObj),
      'SUMMARY:' + icsEsc(title), 'LOCATION:' + icsEsc(place), 'DESCRIPTION:' + icsEsc(C.calendarNote),
      'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', 'DESCRIPTION:Wedding tomorrow', 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
    var blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'wedding-invitation.ics';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    if (!reduce) { var r = this.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, 18, 90); }
  });

  /* ───────── Go ───────── */
  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(frame);
})();
