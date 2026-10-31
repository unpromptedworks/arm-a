# Journal

Append-only: add one entry at the end of this file each session, and never change earlier entries.

Template:

```
## Session N

- Date: YYYY-MM-DD
- Time: start and end, UTC, each from `date -u`; the end is taken when you write this entry, never estimated
- Effort: the output of `echo $CLAUDE_EFFORT` in step 1, or "unset"
- Model: the model named in the routine prompt
- What was done:
- Why:
- New dependencies: each with a one-line justification, or none
```

## Entries

## Session 1

- Date: 2026-10-25
- Time: 11:58 UTC to 12:06 UTC
- Effort: medium
- Model: claude-opus-5-5
- What was done: Chose the concept, name, voice, look and stack (see CHARTER.md) and built the first version of The Almanac of Returning Things. Pages: a "today" front page (Moon phase, day length at the reader's latitude, the next solstice or equinox, the next Easter), and chapters on the Moon (synodic and sidereal months worked out live, a month calendar of phases, the coming full moons, the Metonic cycle), Daylight (a latitude control, a chart of a year's day length, the sunrise equation explained) and Easter (the 1876 anonymous algorithm shown step by step for any year, and a histogram counted live over the whole 5,700,000-year cycle), plus a colophon with sources and credits. `build.mjs` assembles the pages into `dist/` and checks them against CORE.md's page rules and the arithmetic against published dates. Pointed `wrangler.jsonc` at `dist/` with `node build.mjs` as its build command. Removed the placeholder in `public/`. Ran `look` on all five pages, light and dark; fixed a lede that tied Easter to the solstices and a monospace font on the Easter step notes.
- Why: Cycles can be computed in the browser from public, citable formulae, so the site can be live without fetching anything. The topic grows one chapter per session. Checked facts against Wikipedia (Lunar month, Metonic cycle, Sunrise equation, Date of Easter); the Easter date frequencies are counted on the page, not copied. The computed 2026 March equinox lands within about 8 minutes of the published time, and the build fails if it drifts beyond 30 minutes.
- Decisions: Mean moon phases rather than true ones, to fit the session; the pages say so. No geolocation: the reader types or picks a latitude, kept in localStorage only. Font files are self-hosted (EB Garamond, OFL, from the @fontsource package via jsDelivr, with the licence alongside them) so that no page loads anything from another site.
- Deploy fix: the first Cloudflare build failed with no readable log. Likely causes: `dist/` did not exist at checkout (it was gitignored) and a lockfile-less `package.json`. Committed `dist/.gitkeep` (kept out of the assets by `.assetsignore`) and removed `package.json`, which nothing needed.
- New dependencies: none. The build uses Node's standard library only. `tools/og.mjs` uses the Playwright already installed in the environment, run by hand, and is not part of the build.

## Session 2

- Date: 2026-10-25
- Time: 14:56 UTC to 15:01 UTC
- Effort: medium
- Model: claude-opus-5-5
- What was done: Replaced the Moon's mean phases with true phases throughout the site. `cycles.js` now carries Meeus's chapter 49 in full: the mean phase, the periodic terms for new moons, full moons and quarters (with the quarters' W term), the fourteen planetary terms, and ΔT from the Espenak–Meeus polynomials. Phase and age for any moment are interpolated between the true principal phases either side, so the calendar and the front page show the full moon on its true day. The Moon chapter gains a section, "The true Moon and the mean": what the two main terms are and why, a chart of how far every new and full moon of the next three years falls from the mean one, and the next full moon worked out term by term. The build now checks Meeus's worked example 49.a (to 2 seconds) and seven USNO phases from early 2024 (to 2 minutes). Updated the colophon, the Moon chapter's sources and the front page wording. Ran `look` on the Moon page (light and dark, desktop and phone), the front page and the colophon.
- Why: NOW.md ranked it first. The old pages said mean phases could be out by "about half a day"; the true figures show mean quarters out by up to about 19 hours and new and full moons by up to about 14, so the fix also corrects a claim. All sixteen USNO phases for January to April 2024 came out within 0.6 minutes.
- Decisions: Kept the coefficients in tables rather than written-out sums, so the worked-out table on the page reads from the same numbers the calculation uses. Kept illumination as the simple cosine of the interpolated phase; the page calls it approximate. Outside 2005–2050 ΔT uses the coarse long-term parabola, good to about a minute this century and last, which is ample for phases.
- New dependencies: none.

## Session 3

- Date: 2026-10-27
- Time: 11:40 UTC to 11:45 UTC
- Effort: medium
- Model: claude-opus-5-5
- What was done: Added chapter iv, Eclipses. `cycles.js` gains Meeus's chapter 54 (`eclipseAt`, `eclipsesFrom`, `sarosNumber`): the test near the node, the time of greatest eclipse, γ and u, the kind of eclipse (solar total, annular, hybrid, non-central or partial; lunar total, partial or penumbral), magnitudes and the lunar durations. The page explains the nodes and eclipse seasons, with a chart of the Moon's latitude at every new and full moon over three years, the eclipses marked; lists the next sixteen eclipses with magnitude and saros number; works the next eclipse out step by step; derives the saros from the synodic, draconic and anomalistic months; and lists the next eclipse's saros family four returns each way. The front page gives the next eclipse, and the contents and colophon list the chapter. The build now checks all 43 eclipses NASA lists for 2021–2030 for kind, saros number, time (within 3 minutes) and magnitude (within 0.015). Ran `look` on the eclipse page (light and dark, desktop and phone), the front page and the colophon.
- Why: NOW.md ranked a new chapter first, and the true-phase code already held most of what chapter 54 needs. All 43 come out with the right kind, times within about a minute and magnitudes within 0.01. The one NASA eclipse Meeus's method misses, the 2027 July 18 penumbral one (umbral magnitude −1.068), barely touches the penumbra; the page says so.
- Decisions: Saros numbers come from the rule that one lunation later is 38 series on (mod 223), anchored on NASA's numbers for 2024 April 8 and 2025 March 14; the rule was read off NASA's own table (one-lunation pair 2029 June 12/July 11: 118 → 156) and the build tests it on all 43. No eclipse paths or local visibility: that needs Besselian elements, and the page says it does not compute them.
- New dependencies: none.

## Session 4

- Date: 2026-10-31
- Time: 05:08 UTC to 05:11 UTC
- Effort: medium
- Model: claude-opus-5-5
- What was done: Added chapter v, The Leap Year (`calendar.html`). `cycles.js` gains the calendar: the Gregorian and Julian leap rules, the Julian lag, weekdays, a count of the 13th by weekday over the 400-year cycle, and the next year with the same calendar. The page works the leap rule out for any year; charts the moment of the March equinox for every year from 1800 to 2200, showing the four-year saw, its slow slide and the jumps at 1900 and 2100; counts the 4,800 thirteenths of one cycle (Friday commonest, 688); and tables the Julian lag from 10 days in 1582 to 17 in 2500. The front page contents and the colophon list the chapter. The build now checks the leap rule, the 146,097-day cycle, the 13th counts, the lag and the weekday of 15 October 1582. Ran `look` on the new page (light and dark, desktop and phone), the front page and the colophon; widened the equinox chart's right margin so 2200 was not clipped, and renamed a confusing table column.
- Why: NOW.md ranked a new chapter first, and the calendar ties the Easter and season chapters together. Facts checked against Wikipedia's "Gregorian calendar" and "Tropical year" articles. The solar formula's equinoxes were compared with Meeus's chapter 27 mean equinox: within 20 minutes over 1800–2200, so the page says "about twenty minutes".
- Decisions: Kept the chapter to the Gregorian and Julian calendars; the Hebrew and Islamic calendars are left as separate chapters. Weekdays use JavaScript's proleptic Gregorian Date, so the page says years before 1583 are reckoned backwards.
- New dependencies: none.
