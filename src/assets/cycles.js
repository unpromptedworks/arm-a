// The arithmetic behind every page. Plain functions, no dependencies,
// all running in the reader's browser. Dates are JavaScript Date objects
// in UTC unless a function says otherwise.

const DAY_MS = 86400000;
const RAD = Math.PI / 180;

export const SYNODIC_MONTH = 29.530588861; // days, Meeus, Astronomical Algorithms ch. 49
export const SIDEREAL_MONTH = 27.321661; // days

// Julian Day from a Date, and back. JD 2440587.5 is 1970-01-01 00:00 UTC.
export function toJD(date) {
  return date.getTime() / DAY_MS + 2440587.5;
}
export function fromJD(jd) {
  return new Date((jd - 2440587.5) * DAY_MS);
}

// ---------- The Moon (true phases) ----------
// Meeus, Astronomical Algorithms, ch. 49. A principal phase is numbered
// k: whole k for new moons counted from 2000 January 6, k + 0.25 first
// quarter, k + 0.5 full, k + 0.75 last quarter. The mean phase follows
// the steady average month (eq. 49.1); the true phase adds the periodic
// terms, which Meeus gives as good to a minute or so for years near ours.
const NEW_MOON_EPOCH = 2451550.09766;

const norm = (deg) => ((deg % 360) + 360) % 360 * RAD;

// The mean phase, as a Julian Ephemeris Day (Dynamical Time).
export function meanPhaseJDE(k) {
  const T = k / 1236.85;
  return NEW_MOON_EPOCH + SYNODIC_MONTH * k +
    0.00015437 * T * T - 0.00000015 * T ** 3 + 0.00000000073 * T ** 4;
}

// The fundamental arguments of the Moon's motion at phase k, in radians.
function phaseArgs(k) {
  const T = k / 1236.85;
  return {
    T,
    E: 1 - 0.002516 * T - 0.0000074 * T * T, // shrinking eccentricity of the Earth's orbit
    M: norm(2.5534 + 29.1053567 * k - 0.0000014 * T * T - 0.00000011 * T ** 3), // Sun's anomaly
    Mp: norm(201.5643 + 385.81693528 * k + 0.0107582 * T * T + 0.00001238 * T ** 3 - 0.000000058 * T ** 4), // Moon's anomaly
    F: norm(160.7108 + 390.67050284 * k - 0.0016118 * T * T - 0.00000227 * T ** 3 + 0.000000011 * T ** 4), // Moon's argument of latitude
    O: norm(124.7746 - 1.56375588 * k + 0.0020672 * T * T + 0.00000215 * T ** 3), // longitude of the ascending node
  };
}

// The periodic terms, as [coefficient in days, power of E, M, M', F, Ω]
// multiples inside the sine. Meeus prints one list for new moons, one for
// full moons and one for the quarters.
const NEW_TERMS = [
  [-0.40720, 0, 0, 1, 0, 0], [0.17241, 1, 1, 0, 0, 0], [0.01608, 0, 0, 2, 0, 0],
  [0.01039, 0, 0, 0, 2, 0], [0.00739, 1, -1, 1, 0, 0], [-0.00514, 1, 1, 1, 0, 0],
  [0.00208, 2, 2, 0, 0, 0], [-0.00111, 0, 0, 1, -2, 0], [-0.00057, 0, 0, 1, 2, 0],
  [0.00056, 1, 1, 2, 0, 0], [-0.00042, 0, 0, 3, 0, 0], [0.00042, 1, 1, 0, 2, 0],
  [0.00038, 1, 1, 0, -2, 0], [-0.00024, 1, -1, 2, 0, 0], [-0.00017, 0, 0, 0, 0, 1],
  [-0.00007, 0, 2, 1, 0, 0], [0.00004, 0, 0, 2, -2, 0], [0.00004, 0, 3, 0, 0, 0],
  [0.00003, 0, 1, 1, -2, 0], [0.00003, 0, 0, 2, 2, 0], [-0.00003, 0, 1, 1, 2, 0],
  [0.00003, 0, -1, 1, 2, 0], [-0.00002, 0, -1, 1, -2, 0], [-0.00002, 0, 1, 3, 0, 0],
  [0.00002, 0, 0, 4, 0, 0],
];
const FULL_TERMS = NEW_TERMS.map((t, i) => [
  [-0.40614, 0.17302, 0.01614, 0.01043, 0.00734, -0.00515, 0.00209, -0.00111, -0.00057,
    0.00056, -0.00042, 0.00042, 0.00038, -0.00024, -0.00017][i] ?? t[0], ...t.slice(1),
]);
const QUARTER_TERMS = [
  [-0.62801, 0, 0, 1, 0, 0], [0.17172, 1, 1, 0, 0, 0], [-0.01183, 1, 1, 1, 0, 0],
  [0.00862, 0, 0, 2, 0, 0], [0.00804, 0, 0, 0, 2, 0], [0.00454, 1, -1, 1, 0, 0],
  [0.00204, 2, 2, 0, 0, 0], [-0.00180, 0, 0, 1, -2, 0], [-0.00070, 0, 0, 1, 2, 0],
  [-0.00040, 0, 0, 3, 0, 0], [-0.00034, 1, -1, 2, 0, 0], [0.00032, 1, 1, 0, 2, 0],
  [0.00032, 1, 1, 0, -2, 0], [-0.00028, 2, 2, 1, 0, 0], [0.00027, 1, 1, 2, 0, 0],
  [-0.00017, 0, 0, 0, 0, 1], [-0.00005, 0, -1, 1, -2, 0], [0.00004, 0, 0, 2, 2, 0],
  [-0.00004, 0, 1, 1, 2, 0], [0.00004, 0, -2, 1, 0, 0], [0.00003, 0, 1, 1, -2, 0],
  [0.00003, 0, 3, 0, 0, 0], [0.00002, 0, 0, 2, -2, 0], [0.00002, 0, -1, 1, 2, 0],
  [-0.00002, 0, 1, 3, 0, 0],
];
// Small pulls of the planets, the same for every phase: [coefficient, A0, A1 per k].
const PLANET_TERMS = [
  [0.000325, 299.77, 0.107408], [0.000165, 251.88, 0.016321], [0.000164, 251.83, 26.651886],
  [0.000126, 349.42, 36.412478], [0.000110, 84.66, 18.206239], [0.000062, 141.74, 53.303771],
  [0.000060, 207.14, 2.453732], [0.000056, 154.84, 7.30686], [0.000047, 34.52, 27.261239],
  [0.000042, 207.19, 0.121824], [0.000040, 291.34, 1.844379], [0.000037, 161.72, 24.198154],
  [0.000035, 239.56, 25.513099], [0.000023, 331.55, 3.592518],
];

// Every correction for phase k, largest first, each as
// { days, args } where args is [M, M', F, Ω] multiples ("planets" for
// the planetary sum and "quarter" for the quarters' extra W term).
export function phaseCorrections(k) {
  const a = phaseArgs(k);
  const q = ((k % 1) + 1) % 1;
  const list = q === 0 ? NEW_TERMS : q === 0.5 ? FULL_TERMS : QUARTER_TERMS;
  const out = list.map(([c, e, m, mp, f, o]) => ({
    days: c * a.E ** e * Math.sin(m * a.M + mp * a.Mp + f * a.F + o * a.O),
    args: [m, mp, f, o],
  }));
  if (q === 0.25 || q === 0.75) {
    const W = 0.00306 - 0.00038 * a.E * Math.cos(a.M) + 0.00026 * Math.cos(a.Mp) -
      0.00002 * Math.cos(a.Mp - a.M) + 0.00002 * Math.cos(a.Mp + a.M) + 0.00002 * Math.cos(2 * a.F);
    out.push({ days: q === 0.25 ? W : -W, args: "quarter" });
  }
  let planets = 0.000325 * Math.sin(norm(299.77 + 0.107408 * k - 0.009173 * a.T * a.T));
  for (const [c, a0, a1] of PLANET_TERMS.slice(1)) planets += c * Math.sin(norm(a0 + a1 * k));
  out.push({ days: planets, args: "planets" });
  return out.sort((x, y) => Math.abs(y.days) - Math.abs(x.days));
}

export function truePhaseJDE(k) {
  return meanPhaseJDE(k) + phaseCorrections(k).reduce((s, t) => s + t.days, 0);
}

// ΔT, the lag of Universal Time behind Dynamical Time, in seconds:
// the polynomials of Espenak and Meeus for 2005 to 2050, and their
// long-term parabola outside that span.
export function deltaT(year) {
  if (year >= 2005 && year <= 2050) {
    const t = year - 2000;
    return 62.92 + 0.32217 * t + 0.005589 * t * t;
  }
  const u = (year - 1820) / 100;
  return -20 + 32 * u * u;
}

const jdeToDate = (jde) => {
  const approx = fromJD(jde);
  return fromJD(jde - deltaT(approx.getUTCFullYear() + approx.getUTCMonth() / 12) / 86400);
};
export const meanPhase = (k) => jdeToDate(meanPhaseJDE(k));
export const truePhase = (k) => jdeToDate(truePhaseJDE(k));

// The number of the latest principal phase (in quarters: phase k = q/4)
// at or before `date`.
function quarterBefore(date) {
  let q = Math.floor((toJD(date) - NEW_MOON_EPOCH) / (SYNODIC_MONTH / 4));
  while (truePhase(q / 4) > date) q--;
  while (truePhase((q + 1) / 4) <= date) q++;
  return q;
}

// Fraction of the way through the lunation, 0 = new, 0.5 = full,
// interpolated between the true principal phases either side of `date`,
// so the quarters and the full moon fall at their true moments.
export function moonPhase(date) {
  const q = quarterBefore(date);
  const t0 = truePhase(q / 4), t1 = truePhase((q + 1) / 4);
  const p = (q + (date - t0) / (t1 - t0)) / 4;
  return ((p % 1) + 1) % 1;
}

// Days since the last true new moon.
export function moonAge(date) {
  const q = quarterBefore(date);
  return (date - truePhase(Math.floor(q / 4))) / DAY_MS;
}

// Fraction of the disc lit, approximated from the phase.
export function moonIllumination(phase) {
  return (1 - Math.cos(2 * Math.PI * phase)) / 2;
}

export function phaseName(phase) {
  const names = [
    "New moon", "Waxing crescent", "First quarter", "Waxing gibbous",
    "Full moon", "Waning gibbous", "Last quarter", "Waning crescent",
  ];
  return names[Math.floor(phase * 8 + 0.5) % 8];
}

// The number k of the next phase of kind `which` (0 new, 0.25 first
// quarter, 0.5 full, 0.75 last quarter) at or after `date`.
export function nextPhaseK(date, which) {
  let k = Math.floor((toJD(date) - NEW_MOON_EPOCH) / SYNODIC_MONTH) - 1 + which;
  while (truePhase(k) < date) k += 1;
  return k;
}

// The next true phase at or after `date`, as a Date.
export function nextPhase(date, which) {
  return truePhase(nextPhaseK(date, which));
}

// SVG path for the lit part of the disc as seen from the northern
// hemisphere (waxing on the right). Centre (c, c), radius r.
export function moonPath(phase, c, r) {
  const rx = Math.abs(Math.cos(2 * Math.PI * phase)) * r;
  const waxing = phase < 0.5;
  const outer = waxing ? 1 : 0;
  const inner = (waxing ? phase < 0.25 : phase < 0.75) ? 0 : 1;
  const f = (n) => n.toFixed(3);
  return `M ${f(c)} ${f(c - r)} A ${f(r)} ${f(r)} 0 0 ${outer} ${f(c)} ${f(c + r)} ` +
    `A ${f(rx)} ${f(r)} 0 0 ${inner} ${f(c)} ${f(c - r)} Z`;
}

export function moonSVG(phase, size = 120, label = "") {
  const c = size / 2, r = size / 2 - 1;
  return `<svg class="moon" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="${label || phaseName(phase)}">` +
    `<circle cx="${c}" cy="${c}" r="${r}" class="moon-dark"/>` +
    `<path d="${moonPath(phase, c, r)}" class="moon-lit"/></svg>`;
}

// ---------- Eclipses ----------
// Meeus, Astronomical Algorithms, ch. 54. An eclipse can happen only at
// a new moon (of the Sun) or a full moon (of the Moon) that falls near
// one of the nodes, where the Moon's tilted orbit crosses the ecliptic.
// The chapter tests each phase k for that, then finds the time of
// greatest eclipse, γ (the least distance of the Moon's shadow axis from
// the Earth's centre, in Earth radii, positive northward) and u (the
// radius of the umbral cone in the fundamental plane).
export const DRACONIC_MONTH = 27.212220817; // node to node, days
export const ANOMALISTIC_MONTH = 27.554549878; // perigee to perigee, days
export const ECLIPSE_YEAR = 346.620075883; // the Sun from a node back to it, days

export function eclipseAt(k) {
  const solar = ((k % 1) + 1) % 1 === 0;
  const { T, E, M, Mp, F, O } = phaseArgs(k);
  // Too far from the node: no eclipse of any kind.
  if (Math.abs(Math.sin(F)) > 0.36) return null;
  const F1 = F - 0.02665 * RAD * Math.sin(O);
  const A1 = norm(299.77 + 0.107408 * k - 0.009173 * T * T);
  const s = Math.sin, c = Math.cos;
  const corr = (solar ? -0.4075 * s(Mp) + 0.1721 * E * s(M) : -0.4065 * s(Mp) + 0.1727 * E * s(M)) +
    0.0161 * s(2 * Mp) - 0.0097 * s(2 * F1) + 0.0073 * E * s(Mp - M) - 0.0050 * E * s(Mp + M) -
    0.0023 * s(Mp - 2 * F1) + 0.0021 * E * s(2 * M) + 0.0012 * s(Mp + 2 * F1) +
    0.0006 * E * s(2 * Mp + M) - 0.0004 * s(3 * Mp) - 0.0003 * E * s(M + 2 * F1) +
    0.0003 * s(A1) - 0.0002 * E * s(M - 2 * F1) - 0.0002 * E * s(2 * Mp - M) - 0.0002 * s(O);
  const jde = meanPhaseJDE(k) + corr;
  const P = 0.2070 * E * s(M) + 0.0024 * E * s(2 * M) - 0.0392 * s(Mp) + 0.0116 * s(2 * Mp) -
    0.0073 * E * s(Mp + M) + 0.0067 * E * s(Mp - M) + 0.0118 * s(2 * F1);
  const Q = 5.2207 - 0.0048 * E * c(M) + 0.0020 * E * c(2 * M) - 0.3299 * c(Mp) -
    0.0060 * E * c(Mp + M) + 0.0041 * E * c(Mp - M);
  const W = Math.abs(c(F1));
  const gamma = (P * c(F1) + Q * s(F1)) * (1 - 0.0048 * W);
  const u = 0.0059 + 0.0046 * E * c(M) - 0.0182 * c(Mp) + 0.0004 * c(2 * Mp) - 0.0005 * c(M + Mp);
  const g = Math.abs(gamma);
  const out = { k, solar, jde, date: jdeToDate(jde), F: (F / RAD), sinF: s(F), P, Q, gamma, u };

  if (solar) {
    if (g > 1.5433 + u) return null;
    if (g < 0.9972) {
      // The shadow's axis meets the Earth: a central eclipse.
      const omega = 0.00464 * Math.sqrt(1 - g * g);
      out.kind = u < 0 ? "total" : u > 0.0047 ? "annular" : u < omega ? "hybrid" : "annular";
      out.central = true;
    } else if (g < 0.9972 + Math.abs(u)) {
      // The axis misses, but an edge of the umbra grazes the polar regions.
      out.kind = u < 0 ? "total" : "annular";
      out.central = false;
    } else {
      out.kind = "partial";
      out.magnitude = (1.5433 + u - g) / (0.5461 + 2 * u);
    }
    return out;
  }
  // Lunar: the Moon in the Earth's penumbra and umbra.
  out.penumbral = (1.5573 + u - g) / 0.5450;
  out.magnitude = (1.0128 - u - g) / 0.5450;
  if (out.penumbral <= 0) return null;
  out.kind = out.magnitude >= 1 ? "total" : out.magnitude > 0 ? "partial" : "penumbral";
  // Semidurations in minutes of each stage, where it happens.
  const n = 0.5458 + 0.0400 * c(Mp);
  const semi = (h) => (h > g ? (60 / n) * Math.sqrt(h * h - g * g) : 0);
  out.semi = { penumbral: semi(1.5573 + u), partial: semi(1.0128 - u), total: semi(0.4678 - u) };
  return out;
}

// Every eclipse, solar and lunar, from `date` on, in time order, until
// `count` have been found.
export function eclipsesFrom(date, count) {
  const out = [];
  let k = Math.floor((toJD(date) - NEW_MOON_EPOCH) / SYNODIC_MONTH) - 1;
  for (; out.length < count; k += 0.5) {
    const e = eclipseAt(k);
    if (e && e.date >= date) out.push(e);
  }
  return out;
}

// Saros series numbers. Eclipses 223 lunations apart belong to one
// series; one lunation later is always 38 series on (mod 223). Anchored
// on NASA's numbering: the total solar eclipse of 2024 April 8 (k = 300)
// is saros 139, the total lunar eclipse of 2025 March 14 (k = 311.5) saros 123.
export function sarosNumber(k) {
  const [k0, s0] = ((k % 1) + 1) % 1 === 0 ? [300, 139] : [311.5, 123];
  const n = ((s0 + 38 * Math.round(k - k0)) % 223 + 223) % 223;
  return n === 0 ? 223 : n;
}

// ---------- The Sun (low-precision position) ----------
// The Astronomical Almanac's low-precision formulae, good to about
// 0.01 degree between 1950 and 2050.
export function sunPosition(date) {
  const n = toJD(date) - 2451545.0;
  const L = (280.460 + 0.9856474 * n) % 360;
  const g = ((357.528 + 0.9856003 * n) % 360) * RAD;
  const lambda = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * RAD;
  const eps = (23.439 - 0.0000004 * n) * RAD;
  const decl = Math.asin(Math.sin(eps) * Math.sin(lambda));
  const lon = (((lambda / RAD) % 360) + 360) % 360;
  return { decl: decl / RAD, lon };
}

// Hours of daylight at a latitude on a date, using the generalised
// sunrise equation with h0 = -0.833 degrees for refraction and the
// Sun's half-width. Returns 0 for polar night and 24 for polar day.
export function dayLength(date, lat) {
  const { decl } = sunPosition(date);
  const phi = lat * RAD, d = decl * RAD, h0 = -0.833 * RAD;
  const cosH = (Math.sin(h0) - Math.sin(phi) * Math.sin(d)) / (Math.cos(phi) * Math.cos(d));
  if (cosH >= 1) return 0;
  if (cosH <= -1) return 24;
  return (2 * Math.acos(cosH) / RAD) / 15;
}

// The moment the Sun's ecliptic longitude next reaches `target` degrees
// (0 March equinox, 90 June solstice, 180 September equinox,
// 270 December solstice), found by bisection.
export function nextSunLongitude(date, target) {
  const ahead = (d) => (((target - sunPosition(d).lon) % 360) + 360) % 360;
  // The Sun moves just under a degree a day; step to within a day, then bisect.
  let lo = date.getTime();
  let hi = lo + (ahead(date) / 0.9856 + 3) * DAY_MS;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (ahead(new Date(mid)) < 180) lo = mid; else hi = mid;
  }
  return new Date((lo + hi) / 2);
}

export const SEASON_MARKS = [
  { lon: 0, name: "March equinox" },
  { lon: 90, name: "June solstice" },
  { lon: 180, name: "September equinox" },
  { lon: 270, name: "December solstice" },
];

export function nextSeasonMark(date) {
  return SEASON_MARKS
    .map((m) => ({ ...m, date: nextSunLongitude(date, m.lon) }))
    .sort((a, b) => a.date - b.date)[0];
}

// ---------- Easter ----------
// The "Anonymous Gregorian algorithm" (Meeus/Jones/Butcher). Returns
// every intermediate value so pages can show the working.
export function easterSteps(Y) {
  const a = Y % 19, b = Math.floor(Y / 100), c = Y % 100;
  const d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const n = Math.floor((h + l - 7 * m + 114) / 31);
  const o = (h + l - 7 * m + 114) % 31;
  return { a, b, c, d, e, f, g, h, i, k, l, m, n, o, month: n, day: o + 1 };
}

export function easter(Y) {
  const s = easterSteps(Y);
  return new Date(Date.UTC(Y, s.month - 1, s.day));
}

// ---------- The calendar ----------
// The Gregorian rule: every fourth year is leap, except century years,
// except those divisible by 400. The Julian rule stops at the first test.
export const isLeapGregorian = (Y) => (Y % 4 === 0 && Y % 100 !== 0) || Y % 400 === 0;
export const isLeapJulian = (Y) => Y % 4 === 0;

// Days the Julian calendar runs behind the Gregorian, for dates from
// 1 March of year Y (the gap changes on Julian 29 February of century years).
export function julianLag(Y) {
  const b = Math.floor(Y / 100);
  return b - Math.floor(b / 4) - 2;
}

// Day of the week (0 Sunday) of a Gregorian date, from the proleptic
// calendar that JavaScript's Date uses.
export const weekday = (Y, m, d) => {
  const t = new Date(Date.UTC(2000, m - 1, d));
  t.setUTCFullYear(Y);
  return t.getUTCDay();
};

// How many times the 13th of a month falls on each weekday in one
// 400-year Gregorian cycle (4,800 months).
export function thirteenths(start = 2001) {
  const n = [0, 0, 0, 0, 0, 0, 0];
  for (let Y = start; Y < start + 400; Y++) for (let m = 1; m <= 12; m++) n[weekday(Y, m, 13)]++;
  return n;
}

// The next year after Y whose calendar is the same, date for date:
// the same weekday on 1 January and the same kind of year.
export function sameCalendarAfter(Y) {
  const w = weekday(Y, 1, 1), leap = isLeapGregorian(Y);
  for (let y = Y + 1; ; y++) if (weekday(y, 1, 1) === w && isLeapGregorian(y) === leap) return y;
}

// ---------- The week ----------
// The Chaldean order of the seven planets, slowest first. Each hour of
// the day is ruled by the next planet in it; the ruler of a day's first
// hour names the day. 24 hours = 3 weeks of hours and 3 hours more, so
// each day's ruler is three places on (Wikipedia, "Planetary hours").
export const CHALDEAN = ["Saturn", "Jupiter", "Mars", "Sun", "Venus", "Mercury", "Moon"];
// The ruler (index into CHALDEAN) of hour h (0-23) of the d-th day,
// counting from a Saturday (d = 0) whose first hour is Saturn's.
export const hourRuler = (d, h) => (d * 24 + h) % 7;

// Julian Day Number of the Gregorian date (the day whose noon it names).
// (JDN + 1) mod 7 is the weekday, 0 = Sunday.
export function julianDayNumber(Y, m, d) {
  const a = Math.floor((14 - m) / 12), y = Y + 4800 - a, mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

// Conway's Doomsday rule (1973), with the working. Every year, 4/4, 6/6,
// 8/8, 10/10, 12/12, 9/5, 5/9, 11/7, 7/11, the last day of February and
// 3 or 4 January fall on the same weekday, the year's "doomsday".
export function doomsdaySteps(Y, m, d) {
  const c = Math.floor(Y / 100), yy = ((Y % 100) + 100) % 100;
  const anchor = (2 + 5 * (((c % 4) + 4) % 4)) % 7;
  const a = Math.floor(yy / 12), b = yy % 12, q = Math.floor(b / 4);
  const doomsday = (anchor + a + b + q) % 7;
  const leap = isLeapGregorian(Y);
  const ref = [leap ? 4 : 3, leap ? 29 : 28, 14, 4, 9, 6, 11, 8, 5, 10, 7, 12][m - 1];
  const dow = (((doomsday + d - ref) % 7) + 7) % 7;
  return { c, yy, anchor, a, b, q, doomsday, leap, ref, dow };
}

// ISO 8601 week date: weeks start on Monday, and week 1 is the one
// holding the year's first Thursday. Returns the ISO year and week.
export function isoWeek(Y, m, d) {
  const t = new Date(Date.UTC(2000, m - 1, d));
  t.setUTCFullYear(Y);
  const dow = t.getUTCDay() || 7; // Monday 1 ... Sunday 7
  t.setUTCDate(t.getUTCDate() + 4 - dow); // the Thursday of this week
  const year = t.getUTCFullYear();
  const jan1 = new Date(Date.UTC(2000, 0, 1));
  jan1.setUTCFullYear(year);
  return { year, week: Math.floor((t - jan1) / DAY_MS / 7) + 1, dow };
}
// A year has 53 ISO weeks if it starts on a Thursday, or is leap and
// starts on a Wednesday.
export const isoWeeksInYear = (Y) => {
  const w = weekday(Y, 1, 1);
  return w === 4 || (w === 3 && isLeapGregorian(Y)) ? 53 : 52;
};

// ---------- Formatting ----------
const MONTHS = ["January", "February", "March", "April", "May", "June", "July",
  "August", "September", "October", "November", "December"];

export function fmtDate(date, { year = true, utc = false } = {}) {
  const d = utc ? date.getUTCDate() : date.getDate();
  const m = MONTHS[utc ? date.getUTCMonth() : date.getMonth()];
  const y = utc ? date.getUTCFullYear() : date.getFullYear();
  return year ? `${d} ${m} ${y}` : `${d} ${m}`;
}

export function fmtTime(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function fmtHours(h) {
  let hh = Math.floor(h), mm = Math.round((h - hh) * 60);
  if (mm === 60) { hh += 1; mm = 0; }
  return `${hh} h ${String(mm).padStart(2, "0")} min`;
}

export function daysUntil(date, from = new Date()) {
  return Math.ceil((date - from) / DAY_MS);
}

// The reader's chosen latitude, kept only in their own browser.
export function savedLatitude(fallback = 51.5) {
  try {
    const v = parseFloat(localStorage.getItem("latitude"));
    if (Number.isFinite(v) && v >= -90 && v <= 90) return v;
  } catch (_) { /* storage unavailable */ }
  return fallback;
}
export function saveLatitude(v) {
  try { localStorage.setItem("latitude", String(v)); } catch (_) { /* ignore */ }
}

// ---------- The Hebrew calendar ----------
// The fixed (arithmetic) Hebrew calendar. Time is counted in parts:
// 1,080 to the hour, 25,920 to the day. The mean lunation, the molad
// interval, is 29 days 12 hours 793 parts. Hebrew days run from 6 pm
// to 6 pm, local time in Jerusalem. Day numbers D used here count from
// the Sunday before the epoch, so D mod 7 is the weekday (0 = Sunday)
// and day D = 1 is Monday 7 October 3761 BC (proleptic Julian), the
// day of the first molad, "molad tohu": day 2, 5 hours, 204 parts.
export const PARTS_HOUR = 1080, PARTS_DAY = 25920;
export const MOLAD_INTERVAL = 29 * PARTS_DAY + 12 * PARTS_HOUR + 793; // 765,433 parts
const MOLAD_TOHU = 1 * PARTS_DAY + 5 * PARTS_HOUR + 204; // parts from the start of day 0
const HEB_EPOCH_RD = 1373428; // D minus this is the Rata Die day number (RD 1 = 1 January AD 1, Gregorian)
const RD_1970 = 719163; // Rata Die of 1 January 1970
const JERUSALEM_MS = (2 * 60 + 21) * 60000; // mean solar time in Jerusalem, about UT + 2 h 21 min

export const isLeapHebrew = (Y) => (7 * Y + 1) % 19 < 7; // years 3, 6, 8, 11, 14, 17, 19 of the cycle
export const hebrewCycleYear = (Y) => ((Y - 1) % 19) + 1;
export const monthsBeforeYear = (Y) => Math.floor((235 * Y - 234) / 19);

// The molad of the n-th month since the epoch: day number and parts.
export function molad(n) {
  const p = MOLAD_TOHU + n * MOLAD_INTERVAL;
  return { day: Math.floor(p / PARTS_DAY), parts: p % PARTS_DAY };
}
// The molad as a moment, in UT. Day D begins at 6 pm the evening before.
export function moladDate(n) {
  const { day, parts } = molad(n);
  const civil = (day - HEB_EPOCH_RD - RD_1970) * DAY_MS;
  return new Date(civil - 6 * 3600000 + (parts / PARTS_DAY) * DAY_MS - JERUSALEM_MS);
}

// Rosh Hashanah of year Y: the molad of Tishri and the four
// postponements (dehiyyot), each with whether it applied.
export function roshHashanahSteps(Y) {
  const m = molad(monthsBeforeYear(Y));
  let D = m.day;
  const dow = D % 7, p = m.parts, leap = isLeapHebrew(Y), prevLeap = isLeapHebrew(Y - 1);
  const steps = [];
  const zaken = p >= 18 * PARTS_HOUR;
  steps.push({ rule: "molad zaken", test: "molad at or after noon (18 h)", applies: zaken, add: zaken ? 1 : 0 });
  const gatarad = !leap && dow === 2 && p >= 9 * PARTS_HOUR + 204;
  steps.push({ rule: "GaTaRaD", test: "common year, molad on Tuesday at or after 9 h 204 p", applies: gatarad, add: gatarad ? 2 : 0 });
  const betutakpat = prevLeap && dow === 1 && p >= 15 * PARTS_HOUR + 589;
  steps.push({ rule: "BeTUTaKPaT", test: "after a leap year, molad on Monday at or after 15 h 589 p", applies: betutakpat, add: betutakpat ? 1 : 0 });
  if (zaken) D += 1;
  else if (gatarad) D += 2;
  else if (betutakpat) D += 1;
  const adu = [0, 3, 5].includes(D % 7);
  steps.push({ rule: "lo ADU Rosh", test: "not on Sunday, Wednesday or Friday", applies: adu, add: adu ? 1 : 0 });
  if (adu) D += 1;
  return { molad: m, leap, prevLeap, steps, day: D };
}
const hebDayToDate = (D) => new Date((D - HEB_EPOCH_RD - RD_1970) * DAY_MS);
export const roshHashanahDay = (Y) => roshHashanahSteps(Y).day;
export const roshHashanah = (Y) => hebDayToDate(roshHashanahDay(Y)); // 1 Tishri, UTC midnight of its daytime
export const hebrewYearLength = (Y) => roshHashanahDay(Y + 1) - roshHashanahDay(Y);
// 15 Nisan of year Y always falls 163 days before the next 1 Tishri:
// Nisan to Elul is fixed at 30 + 29 + 30 + 29 + 30 + 29 = 177 days.
export const passover = (Y) => hebDayToDate(roshHashanahDay(Y + 1) - 163);
export function hebrewYearOf(date) {
  let Y = date.getUTCFullYear() + 3761;
  while (roshHashanah(Y) > date) Y--;
  return Y;
}

// ---------- The Islamic calendar ----------
// The tabular (arithmetic) Islamic calendar: twelve months alternately
// of 30 and 29 days, with a 30th day added to the last month, Dhu
// al-Hijja, in years 2, 5, 7, 10, 13, 16, 18, 21, 24, 26 and 29 of each
// thirty. The epoch is the civil one, 1 Muharram AH 1 = Friday 16 July
// 622 (Julian), Rata Die 227,015 (Reingold and Dershowitz,
// Calendrical Calculations). Observed and Umm al-Qura dates can differ
// from it by a day or two.
const ISLAMIC_EPOCH_RD = 227015;
export const ISLAMIC_MONTHS = ["Muharram", "Safar", "Rabi‘ al-Awwal", "Rabi‘ al-Thani", "Jumada al-Ula", "Jumada al-Akhira",
  "Rajab", "Sha‘ban", "Ramadan", "Shawwal", "Dhu al-Qa‘da", "Dhu al-Hijja"];
export const ISLAMIC_CYCLE_DAYS = 30 * 354 + 11; // 10,631
export const isLeapIslamic = (Y) => (((14 + 11 * Y) % 30) + 30) % 30 < 11;
export const islamicCycleYear = (Y) => ((((Y - 1) % 30) + 30) % 30) + 1;
export const islamicMonthLength = (Y, m) => (m % 2 === 1 || (m === 12 && isLeapIslamic(Y)) ? 30 : 29);
export const islamicYearLength = (Y) => (isLeapIslamic(Y) ? 355 : 354);
// Rata Die of day d of month m of year Y.
export function islamicRD(Y, m, d) {
  return ISLAMIC_EPOCH_RD - 1 + (Y - 1) * 354 + Math.floor((3 + 11 * Y) / 30) + 29 * (m - 1) + Math.floor((6 * m - 1) / 11) + d;
}
export const rdToDate = (rd) => new Date((rd - RD_1970) * DAY_MS); // UTC midnight
export const dateToRD = (date) => Math.floor(date.getTime() / DAY_MS) + RD_1970; // by its UTC day
export const islamicToDate = (Y, m, d) => rdToDate(islamicRD(Y, m, d));
// The tabular Islamic date of the UTC day of a moment, with the working.
export function islamicFromDate(date) {
  const rd = dateToRD(date), days = rd - ISLAMIC_EPOCH_RD; // whole days since 1 Muharram 1
  const Y = Math.floor((30 * days + 10646) / 10631);
  const m = Math.min(12, Math.ceil((rd - 29 - islamicRD(Y, 1, 1)) / 29.5) + 1);
  const d = rd - islamicRD(Y, m, 1) + 1;
  return { year: Y, month: m, day: d, days, cycles: Math.floor(days / ISLAMIC_CYCLE_DAYS), rest: ((days % ISLAMIC_CYCLE_DAYS) + ISLAMIC_CYCLE_DAYS) % ISLAMIC_CYCLE_DAYS };
}

// ---------- The planets ----------
// Keplerian elements and their rates per Julian century, referred to the
// mean ecliptic and equinox of J2000, from E. M. Standish, "Approximate
// Positions of the Planets", JPL Solar System Dynamics, table 1, valid
// 1800 to 2050. Each row: a (au), e, I, L, long. perihelion, long. node
// (degrees), then the six rates. "Earth" is the Earth–Moon barycentre.
export const PLANET_ELEMENTS = {
  Mercury: [0.38709927, 0.20563593, 7.00497902, 252.25032350, 77.45779628, 48.33076593,
    0.00000037, 0.00001906, -0.00594749, 149472.67411175, 0.16047689, -0.12534081],
  Venus: [0.72333566, 0.00677672, 3.39467605, 181.97909950, 131.60246718, 76.67984255,
    0.00000390, -0.00004107, -0.00078890, 58517.81538729, 0.00268329, -0.27769418],
  Earth: [1.00000261, 0.01671123, -0.00001531, 100.46457166, 102.93768193, 0.0,
    0.00000562, -0.00004392, -0.01294668, 35999.37244981, 0.32327364, 0.0],
  Mars: [1.52371034, 0.09339410, 1.84969142, -4.55343205, -23.94362959, 49.55953891,
    0.00001847, 0.00007882, -0.00813131, 19140.30268499, 0.44441088, -0.29257343],
  Jupiter: [5.20288700, 0.04838624, 1.30439695, 34.39644051, 14.72847983, 100.47390909,
    -0.00011607, -0.00013253, -0.00183714, 3034.74612775, 0.21252668, 0.20469106],
  Saturn: [9.53667594, 0.05386179, 2.48599187, 49.95424423, 92.59887831, 113.66242448,
    -0.00125060, -0.00050991, 0.00193609, 1222.49362201, -0.41897216, -0.28867794],
};
export const NAKED_EYE = ["Mercury", "Venus", "Mars", "Jupiter", "Saturn"];
export const INFERIOR = (p) => p === "Mercury" || p === "Venus";

// Mean sidereal period in days, from the rate of the mean longitude.
export const siderealPeriod = (p) => 36525 * 360 / PLANET_ELEMENTS[p][9];
// Mean synodic period: the time for the planet to gain or lose one whole
// lap on the Earth, 1/S = |1/P - 1/E|.
export const synodicPeriod = (p) => 1 / Math.abs(1 / siderealPeriod(p) - 1 / siderealPeriod("Earth"));

// Heliocentric ecliptic coordinates (au, J2000) at a Julian Day, by
// Standish's recipe: the elements at the date, Kepler's equation for the
// eccentric anomaly, then rotation from the orbit into the ecliptic.
// Dynamical Time and UT differ by about a minute; that is ignored.
export function heliocentric(p, jd) {
  const E0 = PLANET_ELEMENTS[p], T = (jd - 2451545.0) / 36525;
  const [a, e, I, L, w, O] = E0.slice(0, 6).map((v, i) => v + E0[i + 6] * T);
  const omega = (w - O) * RAD, inc = I * RAD, node = O * RAD;
  let M = (((L - w) % 360) + 540) % 360 - 180; // degrees, -180..180
  M *= RAD;
  let E = M + e * Math.sin(M);
  for (let i = 0; i < 20; i++) {
    const dE = (M - (E - e * Math.sin(E))) / (1 - e * Math.cos(E));
    E += dE;
    if (Math.abs(dE) < 1e-12) break;
  }
  const xp = a * (Math.cos(E) - e), yp = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const cw = Math.cos(omega), sw = Math.sin(omega), cO = Math.cos(node), sO = Math.sin(node), cI = Math.cos(inc), sI = Math.sin(inc);
  return {
    x: (cw * cO - sw * sO * cI) * xp + (-sw * cO - cw * sO * cI) * yp,
    y: (cw * sO + sw * cO * cI) * xp + (-sw * sO + cw * cO * cI) * yp,
    z: (sw * sI) * xp + (cw * sI) * yp,
  };
}

// The planet as seen from the Earth at a Date: geocentric ecliptic
// longitude and latitude (degrees), distance (au), the Sun's longitude,
// the elongation (angle from the Sun) and which side of the Sun it is on.
// Light-time and aberration are ignored; for timing conjunctions they
// shift both bodies' positions alike to within a few minutes of arc.
export function planetFromEarth(p, date) {
  const jd = toJD(date), P = heliocentric(p, jd), G = heliocentric("Earth", jd);
  const x = P.x - G.x, y = P.y - G.y, z = P.z - G.z;
  const dist = Math.hypot(x, y, z);
  const lon = ((Math.atan2(y, x) / RAD) + 360) % 360, lat = Math.asin(z / dist) / RAD;
  const sunLon = ((Math.atan2(-G.y, -G.x) / RAD) + 360) % 360;
  const cosEl = -(x * G.x + y * G.y + z * G.z) / (dist * Math.hypot(G.x, G.y, G.z));
  const diff = ((lon - sunLon) % 360 + 360) % 360; // 0..360, east of the Sun when < 180
  return { lon, lat, dist, sunLon, elong: Math.acos(Math.max(-1, Math.min(1, cosEl))) / RAD, east: diff < 180, diff, x, y, z,
    helioLon: ((Math.atan2(P.y, P.x) / RAD) + 360) % 360, sunDist: Math.hypot(P.x, P.y, P.z) };
}

// The planet's events between two Dates, in order: conjunctions with the
// Sun (inferior or superior for Mercury and Venus), oppositions (the
// outer planets), and greatest elongations east and west (Mercury and
// Venus). Found by stepping a day at a time and refining by bisection
// (crossings) or golden-section search (maxima). Each event:
// { date, kind, ...planetFromEarth at that moment }.
export function planetEvents(p, from, to) {
  const out = [], step = 86400000, inner = INFERIOR(p);
  const d = (t) => planetFromEarth(p, new Date(t)).diff;
  const el = (t) => planetFromEarth(p, new Date(t)).elong;
  const wrap = (v) => ((v + 540) % 360) - 180; // -180..180
  const push = (t, kind) => { const at = new Date(t); out.push({ date: at, kind, ...planetFromEarth(p, at) }); };
  let t0 = from.getTime(), d0 = d(t0), e0 = el(t0), e1 = el(t0 + step);
  for (let t = t0 + step; t <= to.getTime(); t += step) {
    const d1 = d(t);
    for (const target of inner ? [0] : [0, 180]) {
      const a = wrap(d0 - target), b = wrap(d1 - target);
      if (a !== b && Math.sign(a) !== Math.sign(b) && Math.abs(a - b) < 90) {
        let lo = t - step, hi = t, fa = a;
        for (let i = 0; i < 40; i++) {
          const mid = (lo + hi) / 2, fm = wrap(d(mid) - target);
          if (Math.sign(fm) === Math.sign(fa)) { lo = mid; fa = fm; } else hi = mid;
        }
        const tc = (lo + hi) / 2;
        if (target === 180) push(tc, "opposition");
        else if (inner) push(tc, planetFromEarth(p, new Date(tc)).dist < 1 ? "inferior conjunction" : "superior conjunction");
        else push(tc, "conjunction");
      }
    }
    if (inner) {
      const e2 = el(t + step);
      if (e1 > e0 && e1 >= e2) {
        let lo = t - 2 * step, hi = t + step;
        const g = (Math.sqrt(5) - 1) / 2;
        for (let i = 0; i < 50; i++) {
          const m1 = hi - g * (hi - lo), m2 = lo + g * (hi - lo);
          if (el(m1) < el(m2)) lo = m1; else hi = m2;
        }
        const tm = (lo + hi) / 2;
        push(tm, planetFromEarth(p, new Date(tm)).east ? "greatest elongation east" : "greatest elongation west");
      }
      e0 = e1; e1 = e2;
    }
    d0 = d1;
  }
  return out.sort((x, y) => x.date - y.date);
}
