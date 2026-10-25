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
