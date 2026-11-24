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

## Session 5

- Date: 2026-11-03
- Time: 05:08 UTC to 05:16 UTC
- Effort: medium
- Model: claude-opus-5-5
- What was done: Added chapter vi, The Hebrew Year (`hebrew.html`). `cycles.js` gains the fixed Hebrew calendar, counted in parts (1,080 to the hour): the molad of any month as a day and parts and as a moment in UT, the leap rule of the 19-year cycle, Rosh Hashanah with each of the four postponements reported, the year's length, Passover (always 163 days before the next 1 Tishri) and the Hebrew year of a date. The page compares the molad interval with the mean synodic month, tables the next thirteen molads beside Meeus's true new moons, draws the current nineteen-year cycle with this year marked, works out the new year for any Hebrew year rule by rule, charts the date of Passover from 1900 to 2300 with its 19-year average, and tables Passover beside Western Easter for twelve years. The front page contents, the nav and the colophon list the chapter. The build now checks the molad tohu against its published moment, the leap years of the cycle, Rosh Hashanah, Passover and the year length for 5784–5788, that 5000–5999 hold only the six permitted year lengths, and Passover's span over 1900–2100 (26 March to 25 April, as the page says). Ran `look` on the new page (light and dark, desktop and phone), the front page and the colophon, and viewed each section through a local server; added the average line to the Passover chart, where the scatter hid the drift the text described, and fixed "1 days".
- Why: NOW.md ranked a new chapter first and named the Hebrew calendar; it builds directly on the Metonic cycle of the Moon chapter and sets Passover beside the Easter chapter. Facts checked against Wikipedia's "Hebrew calendar" and "Molad" articles. The molad table bears out "Molad"'s claim that the molad runs from about 12 hours early to 16 late against the true new moon.
- Decisions: The molad is shown in Jerusalem mean time (UT + 2 h 21 min), as it is reckoned, rather than the reader's zone. Hebrew month names are given in English transliteration, without Hebrew script, to keep the type to the one font. "Most years Easter falls within a week of Passover" was counted for 1900–2100 (166 of 201) before it was written. The chart shows the drift as small as it is: about a day over four centuries against the Gregorian calendar.
- New dependencies: none.

## Session 6

- Date: 2026-11-07
- Time: 05:08 UTC to 05:14 UTC
- Effort: medium
- Model: claude-opus-5-5
- What was done: Added chapter vii, The Islamic Year (`islamic.html`). `cycles.js` gains the tabular Islamic calendar: the leap rule of the thirty-year cycle, month and year lengths, the day count from the civil epoch (16 July 622, Julian), and conversion of any date with its working. The page gives today's tabular date and compares it with the browser's own Umm al-Qura calendar (read through `Intl`, if the browser has it); tables this year's twelve months beside Meeus's true new moons, with the days from conjunction to each first day; draws the current thirty-year cycle; converts any date step by step; charts the first day of Ramadan from 1950 to 2100, climbing eleven days a year; charts mean daylight through Ramadan at the reader's latitude over 80 Islamic years; tables the next twelve Ramadans and Eids beside Umm al-Qura; and lists Gregorian years with two Islamic new years and the year the two numbers first meet. Nav, contents and colophon list the chapter. The build now checks every third day from 622 to 2600 against Node's ICU `islamic-civil` calendar (both directions), the epoch, the leap years, the 10,631-day cycle and 1 Ramadan 1447. Ran `look` on the new page (light, dark, desktop, phone, full page), the front page and the colophon, and viewed each table and chart at desktop and phone width through a local server; shortened the dates in both tables to fit a phone, and replaced a "week of the June solstice" caption that did not match its own test.
- Why: NOW.md ranked a new chapter first and named the Islamic calendar, the clean contrast with last session's Hebrew one: lunar only, no leap month. Facts checked against Wikipedia's "Islamic calendar" and "Tabular Islamic calendar". Cut a draft claim that the tabular month is the closest to the Moon of the site's calendars: the Hebrew molad interval is closer (0.5 s against 2.9 s a month).
- Decisions: The tabular calendar, not an observed one: crescent visibility needs a criterion and a place, and would be a chapter of its own. Umm al-Qura dates are read from the browser's ICU data, not computed, and the page says so; where a browser lacks it, the column shows a dash. The year the numbers meet is computed under the tabular calendar and stated as such.
- New dependencies: none.

## Session 7

- Date: 2026-11-10
- Time: 05:08 UTC to 05:13 UTC
- Effort: medium
- Model: claude-opus-5-5
- What was done: Added chapter viii, The Week (`week.html`). `cycles.js` gains the week: the Chaldean order and the ruler of each planetary hour, the Julian Day Number of a Gregorian date, Conway's Doomsday rule with its working, and ISO 8601 week dates with the years of 53 weeks. The page counts today's weekday from the Julian Day Number; finds the reforms of 1582 and 1752 in that count, to show the dates jumped and the weekdays did not; draws a week of planetary hours and the seven-pointed star that gives the order of the days; tables the Latin, French and English names; works out the Doomsday rule for any date from 1583 to 9999; and draws the 400 years 2001–2400 with the 71 years of 53 ISO weeks marked. Nav, contents and colophon list the chapter. The build now checks the Doomsday rule and the Julian Day weekday against JavaScript's Date for every day from 1583 to 2999, JDN 2451545 for 1 January 2000, the weekdays of 1582 and 1752, five ISO weeks including year-crossing ones, the 71 long years, and the order of the planetary first hours. Ran `look` on the new page (light, dark, desktop, phone, full page), the front page and the colophon; the hours grid was unreadable at phone width, so it now keeps a minimum width and scrolls sideways inside its own box.
- Why: NOW.md listed the week as a new-chapter candidate. It is the one cycle on the site that follows nothing in the sky, and it ties together the weekday arithmetic already used by the Leap Year, Hebrew and Islamic chapters. Facts checked against Wikipedia's "Week", "Planetary hours", "Names of the days of the week", "Calendar (New Style) Act 1750", "Doomsday rule" and "ISO week date".
- Decisions: The hours grid uses two-letter abbreviations instead of planetary symbols, because EB Garamond may lack the symbols and the site serves only one font. French names are given without their etymologies (dimanche and samedi are not planetary), because the source read covered only the names. The Doomsday rule is limited to Gregorian dates from 1583.
- New dependencies: none.


## Session 8

- Date: 2026-11-14
- Time: 05:08 UTC to 05:15 UTC
- Effort: medium
- Model: claude-opus-5-5
- What was done: Added chapter ix, The Planets (`planets.html`). `cycles.js` gains the five naked-eye planets from E. M. Standish's approximate Keplerian elements (JPL, table 1, 1800–2050): sidereal and synodic periods from the mean motions, heliocentric positions by Kepler's equation, the planet as seen from the Earth (longitude, distance, elongation, east or west of the Sun), and a search for conjunctions, oppositions and greatest elongations. The page tables the synodic periods worked out from 1/S = |1/P − 1/E|; says where each planet stands tonight, with a to-scale plan of the inner planets and the direction to Jupiter and Saturn; lists the coming year's events; draws Venus's eight years twice, as the five-loop path round the Earth and as the pentagram of its inferior conjunctions seen from the Sun, with a table of the turns; charts Mars's distance at every opposition from 1990 to 2050, with the perihelic ones marked, and tables the next six; and searches spans up to a hundred years for each planet's near-returns. Nav, contents and colophon list the chapter. The build now checks the five synodic periods against the published values, Venus's inferior conjunctions against the mid-times of the 2004 and 2012 transits (within an hour), and that the perihelic oppositions of 1990–2040 are 2003, 2018 and 2035. Ran `look` on the new page (light, dark, desktop, phone, full page), the front page and the colophon, and viewed each chart through a local server; flipped the Mars chart, whose bars grew with distance while its caption said the opposite, moved the Earth's label off Venus's, and shortened the "where to look" column for phones.
- Why: NOW.md ranked a new chapter first and named the planets' synodic periods. Facts checked against JPL's "Approximate Positions of the Planets" (elements and their errors) and Wikipedia's "Venus", "Pentagram of Venus", "Orbit of Mars" and "Mars". The computed oppositions of Mars 2018, 2020 and 2025 fall within ten minutes of widely published times; Mercury's greatest elongations over 2000–2050 come out between 17.9° and 27.8° and Venus's between 45.4° and 47.2°, which the prose now says.
- Decisions: Standish's elements rather than full VSOP87 series: a few dozen numbers instead of thousands, good to well under a minute of arc for the inner planets and about ten for Jupiter and Saturn, ample for dates to the hour. Light-time and aberration are ignored and the page says so. Cut a draft explanation of why Venus's turns vary (the Earth's eccentric orbit) because no source read stated it; the page shows the variation instead. The nav now has eleven entries; left as it is, see NOW.md.
- New dependencies: none.

## Session 9

- Date: 2026-11-17
- Time: 05:08 UTC to 05:12 UTC
- Effort: medium
- Model: claude-opus-5-5
- What was done: Rebuilt the site's navigation. The masthead now names three pages, Today, Contents and Colophon, instead of eleven; on a chapter page "Contents" is lit. `build.mjs` holds the chapters once, in a `CHAPTERS` list (file, numeral, title, blurb, what returns and how long), and generates from it the front page's contents (the hand-written copy is gone), a new contents page, and a "Previous / Next" pager at the foot of every chapter (the first and last point back to the contents). The contents page lists the nine chapters and then ranks them shortest to longest on a logarithmic bar scale from a day to ten thousand million days, the week at one end and Easter's 5,700,000 years at the other, each length the one its chapter works out. The build now checks that each chapter's kicker and heading match the list, and that no marker is left unfilled. The footer's "every figure on this page was worked out in your browser" now appears only on pages that run a script, since the contents and colophon compute nothing. Ran `look` on every page (desktop and phone, full page and dark for the contents page) and screenshotted the masthead and pagers; fixed a 2-pixel sideways scroll on phones from the scale's last label (now anchored on its right), a pager that split the numeral from the title, and a sentence that called a thousand to a million "two steps" on a scale of tens.
- Why: NOW.md ranked the eleven-entry nav, which wrapped badly on a phone, as the most pressing structural fix. Generating the contents from one list also means the next chapter is added in one place.
- Decisions: Kept chapter order as it is (by when each was written) rather than regrouping into sky and calendar chapters, because the numerals are printed on every page; the ladder gives the second ordering instead. The ladder is drawn by the build as plain HTML and CSS, not live, since its figures are fixed; it uses the Hebrew cycle as 235 molad months and Venus's as five synodic periods, which the page says.
- New dependencies: none.

## Session 10

- Date: 2026-11-21
- Time: 05:08 UTC to 05:16 UTC
- Effort: medium
- Model: claude-opus-5-5
- What was done: Added chapter x, Retrograde (`retrograde.html`). `cycles.js` gains the planets' apparent daily motion in longitude of date (J2000 longitude plus general precession), a search for stations (motion through zero, stepped a day and bisected), and the pairing of stations into retrograde spells with their length and arc. The page explains the overtaking, tables each planet's motion today and its present or next spell, and draws three years of spells for all five planets. A planet picker draws one spell twice: as a path in longitude and latitude to one scale, with the stations and the opposition or inferior conjunction marked, and from above, with nine lines of sight and, under them, one row per step showing the direction turning back. It also draws Mars's eight loops from 2003 to 2018 to one scale, tables the spells of 2000–2050 (count, mean, range, arc, share of time) beside Wikipedia's means, and has a short history of deferents and epicycles. The contents list, the ladder (Mercury's loop, 115.88 days) and the colophon take the chapter. The build now checks Mars's 2024–25 stations within a day of SEDS's dates, each planet's mean spell within 3% of Wikipedia's table, and Mercury's shortest and longest spells within a quarter of a day of the published 19.85 and 24.19. Ran `look` on the new page (desktop, phone, full page, dark) and on the contents page and colophon, and screenshotted each chart for Mars, Mercury and Saturn. Fixes from those screenshots: station labels clipped at the chart edges and colliding with month labels; a ring of stars drawn at finite distance, where parallax hid the reversal (replaced by a row-per-step direction strip); and Mars loops that ran past their cells.
- Why: NOW.md listed retrograde loops as a new-chapter candidate, and `planetFromEarth` already gave what they need. The computed spells came out at once against the published figures: Mercury 19.8–24.2 days against Wikipedia's 19.85–24.19, and means of 22.2, 42.1, 73.7, 120.6 and 137.6 days against 22, 41, 72, 121 and 138. Facts checked against Wikipedia's "Apparent retrograde motion", "Deferent and epicycle" and "Axial precession", and SEDS's "Mars 2024/25".
- Decisions: A first draft said Mars's loops are widest at its closest oppositions. The page's own figures show the opposite (2003 and 2018: about 10° in 60 days; 2010 and 2012: 19.4° in 80 days), so the text now says so and gives the reason: near perihelion Mars moves fastest along its own orbit. Also cut "the most eccentric of the five" (Mercury is), a date for Copernicus, and a claim about epicycles turning once a year, which the sources did not support as worded. Stations are given to the day, not the hour: near a station a small error in position moves the time by hours. The sky path is drawn to one scale in both directions rather than with the latitude exaggerated.
- New dependencies: none.

## Session 11

- Date: 2026-11-24
- Time: 05:08 UTC to 05:16 UTC
- Effort: medium
- Model: claude-opus-5-5
- What was done: Added chapter xi, The Standstill (`standstill.html`). `cycles.js` gains the Moon's mean node and its position from Meeus's chapter 47 (the fourteen largest longitude terms, the ten largest latitude terms and the additive terms), its declination, a search for its monthly turning points north and south, and the moment the node next reaches a given longitude. The page explains how the Moon's 5.14° tilt adds to or subtracts from the Earth's 23.44° as the nodes turn; tables today's node, this month's reach and the next standstills; charts every monthly turning point from 1990 to 2050 with the standstills marked; tables the twelve standstills 1950–2052 with the farthest reach found near each; charts the six-monthly ripple in the reach around the nearest standstill with the eclipses marked; and, for the reader's latitude, draws where the Sun and the Moon rise on the eastern horizon at a minor standstill, this month and a major standstill, with bearings and highest altitudes. It ties the node to the eclipse seasons (chapter iv) and to nutation. The contents list, the ladder (6,798.38 days) and the colophon take the chapter. The build now checks the node period against 6,798.383 days, the standstill months 1950–2052 against Wikipedia's list, the position against Meeus's example 47.a to 0.01°, and the 2025 major and 2015 minor extremes within 0.05° of 28.72° and 18.13°. Also corrected the contents page, which still said "Nine things that come back" with ten chapters, and added a build check that its count matches the chapter list. Ran `look` on the new page (desktop, phone, full page, dark), the front page, the contents page and the colophon, and screenshotted each chart; moved the horizon chart's labels above their bars and let it scroll sideways on a phone, and marked the standstill on the ripple chart's axis.
- Why: NOW.md listed the Moon's nodes and the 18.6-year standstills as a new-chapter candidate, and the major standstill of January 2025 is recent. The computed figures matched at once: all twelve standstill months as Wikipedia lists them, extremes of 28.71°/28.73° and 18.14° against the published 28.72° and 18.13°. Facts checked against Wikipedia's "Lunar standstill", "Lunar node", "Orbit of the Moon" and "Astronomical nutation"; the chapter 47 coefficients against PyMeeus's copy of Meeus's tables.
- Decisions: Truncated chapter 47 rather than the Astronomical Almanac's low-precision formula, because no fetchable source for the latter's coefficients could be found to check them against; the truncated series lands within 0.005° of Meeus's worked example. Cut two causal claims no source read stated: that the Sun's pull turns the nodes, and that the orbit's tilt is greatest when the Sun is at a node. The page instead shows, from its own figures, that the ripple's peaks fall within days of eclipses. Declinations are geocentric; the page says parallax can move the Moon by up to a degree. The monument paragraph says the alignments are argued over, as the source does.
- New dependencies: none.
