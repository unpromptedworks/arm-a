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

if (problems.length) {
  console.error(`Build check failed:\n  ${problems.join("\n  ")}`);
  process.exit(1);
}
console.log(`Built ${files.length} files into ${OUT}/ and checked them.`);
