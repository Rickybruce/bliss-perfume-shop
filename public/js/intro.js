/*
  Perfume intro. Load this in <head> (no defer) so the page stays hidden
  from the very first paint while the intro plays.

  - Plays once per browser session.
  - Skipped for people who ask their device to reduce motion.
  - Add ?intro to any page URL to force it to play again while you're testing.
*/
(function () {
  'use strict';

  var root = document.documentElement;
  var KEY = 'introSeen';

  var seen = false;
  try { seen = sessionStorage.getItem(KEY) === '1'; } catch (e) { /* storage blocked */ }

  var forced = /[?&]intro(=|&|$)/.test(location.search);
  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if ((seen && !forced) || reduceMotion) return;

  root.classList.add('intro-on');

  var SCENE =
    '<svg viewBox="20 10 260 340" xmlns="http://www.w3.org/2000/svg" focusable="false">' +
      '<defs>' +
        '<linearGradient id="ig-glass" x1="0" x2="1" y1="0" y2="0">' +
          '<stop offset="0" stop-color="#b9b2a5"/>' +
          '<stop offset="0.45" stop-color="#ece7de"/>' +
          '<stop offset="1" stop-color="#a59e91"/>' +
        '</linearGradient>' +
        '<filter id="ig-soft" x="-50%" y="-50%" width="200%" height="200%">' +
          '<feGaussianBlur stdDeviation="1.4"/>' +
        '</filter>' +
        '<filter id="ig-cloud" x="-100%" y="-100%" width="300%" height="300%">' +
          '<feGaussianBlur stdDeviation="7"/>' +
        '</filter>' +
      '</defs>' +

      /* Bottle. Drawn first so it starts hidden behind the box. */
      '<g class="i-bottle">' +
        '<rect class="i-glass" x="112" y="236" width="76" height="86" rx="9"/>' +
        '<rect class="i-liquid" x="116" y="272" width="68" height="46" rx="6"/>' +
        '<rect class="i-label" x="126" y="284" width="48" height="22" rx="2"/>' +
        '<rect class="i-label-line" x="132" y="295" width="36" height="1"/>' +
        '<rect class="i-shine" x="118" y="242" width="5" height="72" rx="2.5"/>' +
        '<rect class="i-glass" x="144" y="228" width="12" height="8"/>' +
        '<rect class="i-gold-dark" x="141" y="222" width="18" height="6" rx="1"/>' +
        '<g class="i-pump">' +
          '<rect class="i-steel" x="146" y="212" width="8" height="12"/>' +
          '<rect class="i-steel" x="143" y="206" width="14" height="6" rx="2"/>' +
        '</g>' +
        '<g class="i-cap">' +
          '<rect class="i-gold" x="138" y="202" width="24" height="20" rx="3"/>' +
          '<rect class="i-shine" x="141" y="205" width="3" height="14" rx="1.5"/>' +
        '</g>' +
        '<g class="i-cloud" filter="url(#ig-cloud)">' +
          '<circle cx="142" cy="208" r="14"/>' +
          '<circle cx="142" cy="208" r="20"/>' +
        '</g>' +
        '<g class="i-mist" filter="url(#ig-soft)">' +
          '<circle cx="144" cy="208" r="3"/>' +
          '<circle cx="146" cy="207" r="2.4"/>' +
          '<circle cx="143" cy="209" r="2"/>' +
          '<circle cx="145" cy="206" r="3.2"/>' +
          '<circle cx="147" cy="208" r="1.8"/>' +
          '<circle cx="144" cy="210" r="2.6"/>' +
          '<circle cx="146" cy="209" r="2.2"/>' +
          '<circle cx="143" cy="207" r="1.6"/>' +
          '<circle cx="145" cy="208" r="2.8"/>' +
        '</g>' +
      '</g>' +

      /* Box, drawn over the bottle */
      '<g class="i-box">' +
        '<rect class="i-box-body" x="70" y="200" width="160" height="130" rx="4"/>' +
        '<rect class="i-ribbon" x="146" y="200" width="8" height="130"/>' +
        '<g class="i-lid">' +
          '<rect class="i-box-lid" x="62" y="180" width="176" height="36" rx="4"/>' +
          '<rect class="i-ribbon" x="146" y="180" width="8" height="36"/>' +
        '</g>' +
      '</g>' +
    '</svg>';

  function finish() {
    var el = document.getElementById('intro');
    if (el) el.remove();
    root.classList.remove('intro-on');
    try { sessionStorage.setItem(KEY, '1'); } catch (e) { /* storage blocked */ }
    document.removeEventListener('keydown', onKey);
  }

  function onKey(event) {
    if (event.key === 'Escape') finish();
  }

  document.addEventListener('DOMContentLoaded', function () {
    var overlay = document.createElement('div');
    overlay.className = 'intro';
    overlay.id = 'intro';
    overlay.innerHTML =
      '<div class="intro-stage" aria-hidden="true">' + SCENE + '</div>' +
      '<button type="button" class="intro-skip">Skip</button>';
    document.body.appendChild(overlay);

    // Tap anywhere, press Escape, or use the Skip button to jump to the page
    overlay.addEventListener('click', finish);
    document.addEventListener('keydown', onKey);

    overlay.addEventListener('animationend', function (event) {
      if (event.animationName === 'introOut') finish();
    });
  });
})();