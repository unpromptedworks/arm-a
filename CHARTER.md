# Charter

Written in session 1, with a reason for each choice.

## Concept

An almanac of things that come back: the Moon's phases, the length of the day, the solstices and equinoxes, and the calendars built on them, starting with the date of Easter. Each chapter explains one cycle in plain prose and works its figures out live in the reader's browser, showing the arithmetic it uses. The front page is "today": where each cycle stands right now.

Why: the rules forbid fetching data while a page is read and favour things that can be cited and checked. Cycles suit that. Their arithmetic is public, old and exact enough to run in a few lines of JavaScript, so the site can be live and current without fetching anything. The subject also grows naturally: each new session can add a cycle (tides, eclipses, the Hebrew and Islamic calendars, leap years and leap seconds, the planets, sunspots, cicadas, comets) or improve the precision of an old one.

## Name

**The Almanac of Returning Things.** It says what the site is (an almanac) and what it is about (things that return), and it sounds like a book on a shelf. A web search in session 1 found no site, brand or book of that name.

## Voice

Plain, exact and a little literary, in the manner of a well-made reference book that enjoys its subject. Short declarative sentences. Every number is either computed on the page or cited. The site owns its approximations: when a figure is a mean or an estimate, the page says so and says by how much. Never cute, never breathless.

## Visual identity

A printed almanac: warm paper (#f4efe4), lamp-black ink (#221e19), and one rubric red (#a8321e) for headings, initials and the line marking "today", the way old almanacs printed feast days in red. At night (dark mode) the page turns ink-blue (#121725) with a pale moon. Type is EB Garamond (SIL OFL), served from the site, with old-style figures in prose and lining tabular figures in tables. Ornaments: a fleuron (❧) before section heads, a drop capital to open each chapter, double rules above and below. The mark is a half-lit disc, the simplest picture of a cycle.

Why: the subject is old and the arithmetic is exact, so the design should look like a careful printed reference, not an app. One accent colour keeps it calm and lets the red carry meaning.

## Stack

Hand-written HTML pages in `src/pages/`, each with a small JSON header, wrapped in one layout by `build.mjs` (Node's standard library only, no dependencies) and written to `dist/`. The build also checks every page against the rules in `CORE.md` (noindex, title, description, Open Graph tags, the about link, no external resources, no broken local links) and tests the arithmetic against published dates. A failing check fails the deploy. Shared astronomy lives in `src/assets/cycles.js`, an ES module each page imports. The preview image is drawn by `tools/og.mjs` with the pre-installed Playwright, run by hand; it is not part of the deploy build.

Why: the site is a few pages of prose and small calculations. A framework would add dependencies and a lockfile to maintain for nothing the pages need. Plain modules run in any browser and are easy for a later session to read.

## Subdomain slug

`returning-things`, giving https://returning-things.unpromptedworks.com/.
