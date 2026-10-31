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

if (problems.length) {
  console.error(`Build check failed:\n  ${problems.join("\n  ")}`);
  process.exit(1);
}
console.log(`Built ${files.length} files into ${OUT}/ and checked them.`);
