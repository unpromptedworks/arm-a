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

// ---------- The Moon (mean phases) ----------
// Meeus eq. 49.1: the mean new moon k lunations after 2000 January 6.
// This ignores the periodic terms, so a true phase can differ from
// the mean one by up to about half a day.
const NEW_MOON_EPOCH = 2451550.09766;

export function moonAge(date) {
  const days = toJD(date) - NEW_MOON_EPOCH;
  const age = ((days % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;
  return age;
}

// Fraction of the way through the lunation, 0 = new, 0.5 = full.
export function moonPhase(date) {
  return moonAge(date) / SYNODIC_MONTH;
}

// Fraction of the disc lit, from the phase angle of a mean lunation.
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

// The next mean phase at or after `date`. `which` is 0 new, 0.25 first
// quarter, 0.5 full, 0.75 last quarter.
export function nextPhase(date, which) {
  const k0 = (toJD(date) - NEW_MOON_EPOCH) / SYNODIC_MONTH;
  let k = Math.floor(k0) + which;
  if (k < k0) k += 1;
  return fromJD(NEW_MOON_EPOCH + k * SYNODIC_MONTH);
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
