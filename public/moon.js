// Moon disc drawing shared by the pages.
(function () {
  // Moon disc as an SVG string: dark disc, lit part drawn with a terminator ellipse.
  function moonSVG(cycle, size) {
    var r = 50, waxing = cycle < 0.5, c = waxing ? cycle : 1 - cycle;
    var rx = Math.abs(Math.cos(2 * Math.PI * c)) * r;
    var sweep = c < 0.25 ? 0 : 1;
    var lit = c < 0.005 ? '' :
      '<path d="M50 0A50 50 0 0 1 50 100A' + rx.toFixed(2) + ' 50 0 0 ' + sweep + ' 50 0Z" fill="var(--lit)"' +
      (waxing ? '' : ' transform="translate(100 0) scale(-1 1)"') + '/>';
    return '<svg viewBox="-2 -2 104 104" width="' + size + '" height="' + size + '" aria-hidden="true">' +
      '<circle cx="50" cy="50" r="50" fill="var(--dark)" stroke="var(--rim)" stroke-width="1.5"/>' + lit + '</svg>';
  }
  window.moonSVG = moonSVG;
})();
