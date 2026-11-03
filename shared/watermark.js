/*
 * EvnQ floating watermark — injected on every page by including this one script.
 * Include with a plain <script src="…/shared/watermark.js"></script> before </body>.
 * Change LOGO_FILE to swap the logo (any file placed in /shared).
 */
(function () {
  'use strict';
  if (document.getElementById('evnq-watermark')) return;

  var LOGO_FILE = 'logo.png';
  var LINK = 'https://www.instagram.com/invites/contact/?utm_content=10y5v4es&srtk=2od0mn8c877b';

  var me = document.currentScript;
  var base = me && me.src ? me.src.replace(/[^\/]*(\?.*)?$/, '') : '';

  var css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = base + 'watermark.css';
  document.head.appendChild(css);

  function mount() {
    if (document.getElementById('evnq-watermark')) return;
    var a = document.createElement('a');
    a.id = 'evnq-watermark';
    a.className = 'evnq-wm';
    a.href = LINK;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.setAttribute('aria-label', 'EvnQ — open our Instagram page in a new tab');

    var disc = document.createElement('span');
    disc.className = 'evnq-wm__disc';
    var img = document.createElement('img');
    img.src = base + LOGO_FILE;
    img.alt = '';
    img.width = 66;
    img.height = 66;
    img.decoding = 'async';
    img.draggable = false;
    disc.appendChild(img);
    a.appendChild(disc);
    document.body.appendChild(a);
  }

  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount);
})();
