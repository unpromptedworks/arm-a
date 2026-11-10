// Builds the site from src/ into dist/, then checks the output against
// the rules every page must keep. No dependencies: Node's standard
// library only. Run with `node build.mjs`.

import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, cpSync, existsSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const SITE = "https://returning-things.unpromptedworks.com";
const NAME = "The Almanac of Returning Things";
const ABOUT = "https://unpromptedworks.com/#about";
const SRC = "src", OUT = "dist";

// Pages, in the order they appear in the contents.
const NAV = [
  { file: "index.html", short: "Today" },
  { file: "moon.html", short: "The Moon" },
  { file: "daylight.html", short: "Daylight" },
  { file: "easter.html", short: "Easter" },
  { file: "eclipses.html", short: "Eclipses" },
  { file: "calendar.html", short: "Leap years" },
  { file: "hebrew.html", short: "Hebrew year" },
  { file: "islamic.html", short: "Islamic year" },
  { file: "week.html", short: "The week" },
  { file: "colophon.html", short: "Colophon" },
];

// Each page starts with <!--meta {json} --> giving title, description
// and, optionally, a script to load.
function parsePage(text, file) {
  const m = text.match(/^<!--meta\s+([\s\S]*?)\s*-->\s*/);
  if (!m) throw new Error(`${file}: missing <!--meta {...} --> header`);
  return { meta: JSON.parse(m[1]), body: text.slice(m[0].length) };
}

const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

function layout(file, meta, body) {
  const title = file === "index.html" ? NAME : `${meta.title} · ${NAME}`;
  const url = file === "index.html" ? `${SITE}/` : `${SITE}/${file}`;
  const nav = NAV.map((n) =>
    `<a href="${n.file === "index.html" ? "./" : n.file}"${n.file === file ? ' aria-current="page"' : ""}>${n.short}</a>`
  ).join("\n      ");
  const script = meta.script ? `\n<script type="module" src="assets/${meta.script}"></script>` : "";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${esc(title)}</title>
<meta name="description" content="${esc(meta.description)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(NAME)}">
<meta property="og:title" content="${esc(meta.title)}">
<meta property="og:description" content="${esc(meta.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="assets/style.css">${script}
</head>
<body>
<header class="masthead">
  <a class="wordmark" href="./"><span class="ring" aria-hidden="true"></span><span>The Almanac of <em>Returning Things</em></span></a>
  <nav aria-label="Contents">
      ${nav}
  </nav>
</header>
<main>
${body.trim()}
</main>
<footer class="colophon">
  <p>Every figure on this page was worked out in your browser when it loaded. Nothing is fetched and nothing you enter leaves your device.</p>
  <p><a href="${ABOUT}">An AI made this site.</a> · <a href="colophon.html">Sources and credits</a></p>
</footer>
</body>
</html>
`;
}

// ---------- build ----------
// Empty dist/ but keep the committed .gitkeep, so the directory always exists for wrangler.
mkdirSync(OUT, { recursive: true });
for (const f of readdirSync(OUT)) if (f !== ".gitkeep") rmSync(join(OUT, f), { recursive: true, force: true });
cpSync(join(SRC, "assets"), join(OUT, "assets"), { recursive: true });
cpSync(join(SRC, "static"), OUT, { recursive: true });

for (const { file } of NAV) {
  const { meta, body } = parsePage(readFileSync(join(SRC, "pages", file), "utf8"), file);
  writeFileSync(join(OUT, file), layout(file, meta, body));
}
const extra = readdirSync(join(SRC, "pages")).filter((f) => !NAV.some((n) => n.file === f));
if (extra.length) throw new Error(`pages not in NAV: ${extra.join(", ")}`);

// ---------- check ----------
const problems = [];
const walk = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : [p];
});
const files = walk(OUT).filter((p) => !p.endsWith(".gitkeep"));

const headers = join(OUT, "_headers");
if (!existsSync(headers) || !/X-Robots-Tag:\s*noindex/.test(readFileSync(headers, "utf8"))) {
  problems.push("_headers must send X-Robots-Tag: noindex");
}
for (const need of ["favicon.svg", "og.png"]) {
  if (!existsSync(join(OUT, need))) problems.push(`missing ${need}`);
}

for (const f of files.filter((p) => extname(p) === ".html")) {
  const html = readFileSync(f, "utf8");
  const has = (re, what) => { if (!re.test(html)) problems.push(`${f}: no ${what}`); };
  has(/<meta name="robots" content="noindex">/, "robots noindex");
  has(/<title>[^<]+<\/title>/, "title");
  has(/<meta name="description" content="[^"]+">/, "meta description");
  for (const p of ["og:title", "og:description", "og:image"]) has(new RegExp(`property="${p}" content="[^"]+"`), p);
  has(/href="https:\/\/unpromptedworks\.com\/#about"/, "link to the about page");
  has(/rel="icon"/, "favicon");
  // Nothing loads from another site: scripts, styles, images, frames.
  for (const m of html.matchAll(/<(script|link|img|iframe|source|audio|video)\b[^>]*\b(src|href)="([^"]+)"/g)) {
    if (/^(https?:)?\/\//.test(m[3])) problems.push(`${f}: external ${m[1]} ${m[3]}`);
  }
  // Local links must resolve.
  for (const m of html.matchAll(/\b(?:href|src)="([^"#:]+)(?:#[^"]*)?"/g)) {
    const target = m[1] === "./" ? "index.html" : m[1];
    if (!existsSync(join(OUT, target))) problems.push(`${f}: broken link ${m[1]}`);
  }
}
for (const f of files.filter((p) => [".js", ".css"].includes(extname(p)))) {
  const text = readFileSync(f, "utf8");
  if (/\bfetch\(|XMLHttpRequest|@import\s+url\(\s*["']?https?:|url\(\s*["']?https?:/.test(text)) {
    problems.push(`${f}: reaches for another site`);
  }
}

// The arithmetic itself, against dates published elsewhere.
const C = await import("./src/assets/cycles.js");
const iso = (d) => d.toISOString().slice(0, 10);
const expect = (got, want, what) => { if (got !== want) problems.push(`${what}: got ${got}, want ${want}`); };
expect(iso(C.easter(2024)), "2024-03-31", "Easter 2024");
expect(iso(C.easter(2025)), "2025-04-20", "Easter 2025");
expect(iso(C.easter(2285)), "2285-03-22", "Easter 2285");
expect(iso(C.easter(2038)), "2038-04-25", "Easter 2038");
const eq = C.nextSunLongitude(new Date("2026-01-01T00:00:00Z"), 0);
if (Math.abs(eq - new Date("2026-03-20T14:46:00Z")) > 30 * 60000) problems.push(`March equinox 2026 off: ${eq.toISOString()}`);

// True moon phases: Meeus's worked example 49.a, and the U.S. Naval
// Observatory's phases for early 2024 (UT), each to within two minutes.
if (Math.abs(C.truePhaseJDE(-283) - 2443192.65118) > 0.00002) problems.push(`Meeus example 49.a: got ${C.truePhaseJDE(-283)}`);
for (const [t, which] of [["2024-01-11T11:57", 0], ["2024-01-18T03:52", 0.25], ["2024-01-25T17:54", 0.5],
  ["2024-02-02T23:18", 0.75], ["2024-03-25T07:00", 0.5], ["2024-04-02T03:15", 0.75], ["2024-04-08T18:21", 0]]) {
  const want = new Date(`${t}Z`), got = C.nextPhase(new Date(want - 3 * 86400000), which);
  if (Math.abs(got - want) > 2 * 60000) problems.push(`phase ${which} near ${t}: got ${got.toISOString()}`);
}

// Eclipses: every eclipse NASA lists for 2021 to 2030 (Espenak), by
// greatest eclipse in Dynamical Time, kind, saros and magnitude (solar
// partials and lunar umbral). Meeus ch. 54 misses only the 2027 July 18
// penumbral eclipse, which barely touches the penumbra.
const NASA = [
  ["2021-05-26T11:19:53", "L", "total", 121, 1.009], ["2021-06-10T10:43:06", "S", "annular", 147],
  ["2021-11-19T09:04:06", "L", "partial", 126, 0.974], ["2021-12-04T07:34:38", "S", "total", 152],
  ["2022-04-30T20:42:36", "S", "partial", 119, 0.640], ["2022-05-16T04:12:42", "L", "total", 131, 1.414],
  ["2022-10-25T11:01:19", "S", "partial", 124, 0.862], ["2022-11-08T11:00:22", "L", "total", 136, 1.359],
  ["2023-04-20T04:17:55", "S", "hybrid", 129], ["2023-05-05T17:24:05", "L", "penumbral", 141, -0.046],
  ["2023-10-14T18:00:40", "S", "annular", 134], ["2023-10-28T20:15:18", "L", "partial", 146, 0.122],
  ["2024-03-25T07:13:59", "L", "penumbral", 113, -0.132], ["2024-04-08T18:18:29", "S", "total", 139],
  ["2024-09-18T02:45:25", "L", "partial", 118, 0.085], ["2024-10-02T18:46:13", "S", "annular", 144],
  ["2025-03-14T06:59:56", "L", "total", 123, 1.178], ["2025-03-29T10:48:36", "S", "partial", 149, 0.938],
  ["2025-09-07T18:12:58", "L", "total", 128, 1.362], ["2025-09-21T19:43:04", "S", "partial", 154, 0.855],
  ["2026-02-17T12:13:05", "S", "annular", 121], ["2026-03-03T11:34:52", "L", "total", 133, 1.151],
  ["2026-08-12T17:47:05", "S", "total", 126], ["2026-08-28T04:14:04", "L", "partial", 138, 0.930],
  ["2027-02-06T16:00:47", "S", "annular", 131], ["2027-02-20T23:14:06", "L", "penumbral", 143, -0.057],
  ["2027-08-02T10:07:49", "S", "total", 136], ["2027-08-17T07:14:59", "L", "penumbral", 148, -0.525],
  ["2028-01-12T04:14:13", "L", "partial", 115, 0.066], ["2028-01-26T15:08:58", "S", "annular", 141],
  ["2028-07-06T18:20:57", "L", "partial", 120, 0.389], ["2028-07-22T02:56:39", "S", "total", 146],
  ["2028-12-31T16:53:15", "L", "total", 125, 1.246], ["2029-01-14T17:13:47", "S", "partial", 151, 0.871],
  ["2029-06-12T04:06:13", "S", "partial", 118, 0.458], ["2029-06-26T03:23:22", "L", "total", 130, 1.844],
  ["2029-07-11T15:37:18", "S", "partial", 156, 0.230], ["2029-12-05T15:03:57", "S", "partial", 123, 0.891],
  ["2029-12-20T22:43:12", "L", "total", 135, 1.117], ["2030-06-01T06:29:13", "S", "annular", 128],
  ["2030-06-15T18:34:34", "L", "partial", 140, 0.502], ["2030-11-25T06:51:37", "S", "total", 133],
  ["2030-12-09T22:28:51", "L", "penumbral", 145, -0.163],
];
const found = C.eclipsesFrom(new Date("2021-01-01T00:00:00Z"), NASA.length);
NASA.forEach(([td, body, kind, saros, mag], i) => {
  const e = found[i], what = `${body === "S" ? "solar" : "lunar"} eclipse ${td.slice(0, 10)}`;
  if (!e) return problems.push(`${what}: not found`);
  const at = C.fromJD(e.jde);
  if (Math.abs(at - new Date(`${td}Z`)) > 3 * 60000) problems.push(`${what}: greatest at ${at.toISOString()}`);
  expect(`${e.solar ? "S" : "L"} ${e.kind}`, `${body} ${kind}`, what);
  expect(C.sarosNumber(e.k), saros, `${what} saros`);
  if (mag !== undefined && Math.abs(e.magnitude - mag) > 0.015) problems.push(`${what}: magnitude ${e.magnitude.toFixed(3)}, want ${mag}`);
});

// The calendar: the leap rule, the 400-year cycle of 146,097 days, the
// weekday counts of the 13th over it (Friday 688, the commonest), the
// Julian lag and the first Gregorian day, Friday 15 October 1582.
for (const [Y, leap] of [[1900, false], [2000, true], [2024, true], [2026, false], [2100, false], [2400, true]]) {
  expect(C.isLeapGregorian(Y), leap, `leap ${Y}`);
}
expect((Date.UTC(2401, 0, 1) - Date.UTC(2001, 0, 1)) / 86400000, 146097, "days in 400 years");
expect(C.thirteenths().join(" "), "687 685 685 687 684 688 684", "13ths by weekday");
expect([1582, 1700, 1800, 1900, 2026, 2100].map(C.julianLag).join(" "), "10 11 12 13 13 14", "Julian lag");
expect(C.weekday(1582, 10, 15), 5, "15 October 1582 weekday");
expect(C.sameCalendarAfter(2026), 2037, "calendar after 2026");

// The Hebrew calendar: the molad tohu (Sunday 6 October 3761 BC Julian,
// 23:11:20 Jerusalem, so 20:50:20 UT on 6 September proleptic
// Gregorian), the leap years of the cycle, and published dates of
// Rosh Hashanah and of the first day of Passover.
expect(C.moladDate(0).toISOString(), "-003760-09-06T20:50:20.000Z", "molad tohu");
expect([...Array(19)].map((_, i) => i + 1).filter((c) => C.isLeapHebrew(5776 + c)).join(" "), "3 6 8 11 14 17 19", "Hebrew leap years");
for (const [Y, rh, pes, len] of [[5784, "2023-09-16", "2024-04-23", 383], [5785, "2024-10-03", "2025-04-13", 355],
  [5786, "2025-09-23", "2026-04-02", 354], [5787, "2026-09-12", "2027-04-22", 385], [5788, "2027-10-02", "2028-04-11", 355]]) {
  expect(iso(C.roshHashanah(Y)), rh, `Rosh Hashanah ${Y}`);
  expect(iso(C.passover(Y)), pes, `Passover ${Y}`);
  expect(C.hebrewYearLength(Y), len, `length of ${Y}`);
}
const lengths = new Set();
for (let Y = 5000; Y < 6000; Y++) lengths.add(C.hebrewYearLength(Y));
expect([...lengths].sort().join(" "), "353 354 355 383 384 385", "Hebrew year lengths");
const pesachSpan = [];
for (let G = 1900; G <= 2100; G++) pesachSpan.push(iso(C.passover(G + 3760)).slice(5));
expect(`${pesachSpan.sort()[0]} ${pesachSpan.at(-1)}`, "03-26 04-25", "Passover span 1900-2100");

// The Islamic calendar: the tabular rule against the islamic-civil
// calendar of the ICU library built into Node, every 3 days from 622 to
// 2600; the leap years of the cycle; and the thirty years' 10,631 days.
{
  const f = new Intl.DateTimeFormat("en-u-ca-islamic-civil", { timeZone: "UTC", year: "numeric", month: "numeric", day: "numeric" });
  if (f.resolvedOptions().calendar !== "islamic-civil") problems.push("Node lacks the islamic-civil calendar to check against");
  else {
    let bad = 0;
    for (let rd = C.islamicRD(1, 1, 1); rd < C.dateToRD(new Date(Date.UTC(2600, 0, 1))); rd += 3) {
      const d = C.rdToDate(rd), h = C.islamicFromDate(d), p = Object.fromEntries(f.formatToParts(d).map((x) => [x.type, x.value]));
      if (`${h.year} ${h.month} ${h.day}` !== `${parseInt(p.year, 10)} ${p.month} ${p.day}`) bad++;
      if (C.islamicRD(h.year, h.month, h.day) !== rd) bad++;
    }
    expect(bad, 0, "tabular Islamic dates disagreeing with ICU islamic-civil");
  }
  expect(C.islamicToDate(1, 1, 1).toISOString().slice(0, 10), "0622-07-19", "1 Muharram AH 1 (proleptic Gregorian)");
  expect([...Array(30)].map((_, i) => i + 1).filter(C.isLeapIslamic).join(" "), "2 5 7 10 13 16 18 21 24 26 29", "Islamic leap years");
  expect(C.islamicRD(1471, 1, 1) - C.islamicRD(1441, 1, 1), 10631, "days in thirty Islamic years");
  expect(iso(C.islamicToDate(1447, 9, 1)), "2026-02-18", "1 Ramadan 1447 (tabular)");
}

// The week: Conway's Doomsday rule and the Julian Day Number against
// JavaScript's Date for every day from 1583 to 2999; ISO weeks against
// Node's own week numbering of dates; the 71 years of 53 ISO weeks in
// 400; the British change of 1752 (Wednesday 2 September, then Thursday
// 14 September by the Gregorian count); and the planetary hours, which
// must give the days in the order Saturn, Sun, Moon, Mars, Mercury,
// Jupiter, Venus.
{
  let bad = 0;
  for (let t = Date.UTC(1583, 0, 1); t < Date.UTC(3000, 0, 1); t += 86400000) {
    const d = new Date(t), Y = d.getUTCFullYear(), m = d.getUTCMonth() + 1, day = d.getUTCDate();
    if (C.doomsdaySteps(Y, m, day).dow !== d.getUTCDay()) bad++;
    if ((C.julianDayNumber(Y, m, day) + 1) % 7 !== d.getUTCDay()) bad++;
  }
  expect(bad, 0, "Doomsday or Julian Day weekdays disagreeing with Date");
  expect(C.julianDayNumber(2000, 1, 1), 2451545, "JDN of 1 January 2000");
  expect(C.weekday(1582, 10, 14), 4, "Julian 4 October 1582 (Gregorian 14 October) weekday");
  expect(C.weekday(1752, 9, 13), 3, "Gregorian 13 September 1752 weekday");
  expect(C.weekday(1752, 9, 14), 4, "14 September 1752 weekday");
  let n53 = 0;
  for (let Y = 2001; Y <= 2400; Y++) if (C.isoWeeksInYear(Y) === 53) n53++;
  expect(n53, 71, "years of 53 ISO weeks in 400");
  for (const [date, want] of [["2026-11-10", "2026-W46"], ["2021-01-03", "2020-W53"], ["2024-12-30", "2025-W01"], ["2026-12-31", "2026-W53"], ["2027-01-01", "2026-W53"]]) {
    const [Y, m, d] = date.split("-").map(Number), w = C.isoWeek(Y, m, d);
    expect(`${w.year}-W${String(w.week).padStart(2, "0")}`, want, `ISO week of ${date}`);
  }
  expect([...Array(7)].map((_, i) => C.CHALDEAN[C.hourRuler(i, 0)]).join(" "), "Saturn Sun Moon Mars Mercury Jupiter Venus", "planetary first hours");
}

if (problems.length) {
  console.error(`Build check failed:\n  ${problems.join("\n  ")}`);
  process.exit(1);
}
console.log(`Built ${files.length} files into ${OUT}/ and checked them.`);
