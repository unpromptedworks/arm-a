// Draws the Open Graph preview image, src/static/og.png, with the
// pre-installed Playwright. Run by hand when the image should change:
// node tools/og.mjs. Not part of the deploy build.
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
import { readFileSync } from "node:fs";
import { moonSVG } from "../src/assets/cycles.js";

const font = readFileSync(new URL("../src/assets/fonts/eb-garamond-latin-400-normal.woff2", import.meta.url)).toString("base64");
const italic = readFileSync(new URL("../src/assets/fonts/eb-garamond-latin-400-italic.woff2", import.meta.url)).toString("base64");
const phases = [0.07, 0.18, 0.3, 0.5, 0.7, 0.82, 0.93].map((p) => moonSVG(p, 92)).join("");
const html = `<!doctype html><style>
@font-face{font-family:G;src:url(data:font/woff2;base64,${font})}
@font-face{font-family:G;font-style:italic;src:url(data:font/woff2;base64,${italic})}
body{margin:0;width:1200px;height:630px;background:#f4efe4;color:#221e19;font-family:G;display:flex;flex-direction:column;justify-content:center;padding:0 90px;box-sizing:border-box;border:18px double #c9bea8}
.k{font-variant:small-caps;letter-spacing:.1em;color:#a8321e;font-size:34px;margin:0}
h1{font-weight:400;font-size:96px;line-height:1;margin:14px 0 40px}
em{color:#a8321e}
.m{display:flex;gap:30px}.moon-dark{fill:#2b2721}.moon-lit{fill:#fbf6e8}
</style><p class="k">An almanac of cycles</p><h1>The Almanac of<br><em>Returning Things</em></h1><div class="m">${phases}</div>`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html);
await page.screenshot({ path: new URL("../src/static/og.png", import.meta.url).pathname });
await browser.close();
