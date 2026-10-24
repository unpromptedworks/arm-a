// Moon phase times: mean phase plus the largest periodic corrections,
// after Jean Meeus, "Astronomical Algorithms" (2nd ed.), chapter 49.
// Quarters omit the small planetary terms. Accuracy is within roughly an hour, good enough for an almanac.
(function (root) {
  var RAD = Math.PI / 180;
  var UNIX_JD = 2440587.5;

  // kind: 0 = new moon, 0.5 = full moon. k is the lunation index (2000-01-06 = 0).
  function phaseJD(k, kind) {
    k = k + kind;
    var T = k / 1236.85;
    var jde = 2451550.09766 + 29.530588861 * k + 0.00015437 * T * T;
    var E = 1 - 0.002516 * T - 0.0000074 * T * T;
    var M = (2.5534 + 29.1053567 * k) * RAD;
    var Mp = (201.5643 + 385.81693528 * k) * RAD;
    var F = (160.7108 + 390.67050284 * k) * RAD;
    var c = kind === 0.25 || kind === 0.75
      ? -0.62801 * Math.sin(Mp) + 0.17172 * E * Math.sin(M) - 0.01183 * E * Math.sin(Mp + M) +
        0.00862 * Math.sin(2 * Mp) + 0.00804 * Math.sin(2 * F) + 0.00454 * E * Math.sin(Mp - M) +
        0.00204 * E * E * Math.sin(2 * M) - 0.0018 * Math.sin(Mp - 2 * F) - 0.0007 * Math.sin(Mp + 2 * F) +
        (kind === 0.25 ? 1 : -1) * (0.00306 - 0.00038 * E * Math.cos(M) + 0.00026 * Math.cos(Mp) -
          0.00002 * Math.cos(Mp - M) + 0.00002 * Math.cos(Mp + M) + 0.00002 * Math.cos(2 * F))
      : kind === 0
      ? -0.4072 * Math.sin(Mp) + 0.17241 * E * Math.sin(M) + 0.01608 * Math.sin(2 * Mp) +
        0.01039 * Math.sin(2 * F) + 0.00739 * E * Math.sin(Mp - M) - 0.00514 * E * Math.sin(Mp + M) +
        0.00208 * E * E * Math.sin(2 * M)
      : -0.40614 * Math.sin(Mp) + 0.17302 * E * Math.sin(M) + 0.01614 * Math.sin(2 * Mp) +
        0.01043 * Math.sin(2 * F) + 0.00734 * E * Math.sin(Mp - M) - 0.00515 * E * Math.sin(Mp + M) +
        0.00209 * E * E * Math.sin(2 * M);
    return jde + c;
  }

  function jdToDate(jd) { return new Date((jd - UNIX_JD) * 86400000); }
  function dateToJD(d) { return d.getTime() / 86400000 + UNIX_JD; }

  var TYPES = { 0: 'new', 0.25: 'first', 0.5: 'full', 0.75: 'last' };

  // All new, quarter and full moons whose time falls in [from, to), as {date, type}.
  function phasesBetween(from, to) {
    var out = [];
    var k0 = Math.floor((dateToJD(from) - 2451550.09766) / 29.530588861) - 1;
    for (var k = k0; ; k++) {
      var done = false;
      [0, 0.25, 0.5, 0.75].forEach(function (kind) {
        var d = jdToDate(phaseJD(k, kind));
        if (d >= to) done = true;
        else if (d >= from) out.push({ date: d, type: TYPES[kind] });
      });
      if (done) break;
    }
    return out.sort(function (a, b) { return a.date - b.date; });
  }

  // Age in days since the previous new moon, and illuminated fraction 0..1.
  function state(date) {
    var p = phasesBetween(new Date(date.getTime() - 35 * 86400000), new Date(date.getTime() + 35 * 86400000));
    var news = p.filter(function (x) { return x.type === 'new'; });
    var prev = null, next = null;
    news.forEach(function (n) { if (n.date <= date) prev = n.date; else if (!next) next = n.date; });
    var frac = (date - prev) / (next - prev); // 0 new, .5 full
    return { age: (date - prev) / 86400000, cycle: frac, lit: (1 - Math.cos(2 * Math.PI * frac)) / 2 };
  }

  var NAMES = ['New moon', 'Waxing crescent', 'First quarter', 'Waxing gibbous', 'Full moon', 'Waning gibbous', 'Last quarter', 'Waning crescent'];
  function phaseName(cycle) { return NAMES[Math.floor(((cycle * 8) + 0.5)) % 8]; }

  root.Lunar = { phaseJD: phaseJD, phasesBetween: phasesBetween, state: state, phaseName: phaseName };
  if (typeof module !== 'undefined') module.exports = root.Lunar;
})(typeof window !== 'undefined' ? window : globalThis);
