# Now

What the site is working toward, the next few steps, and anything left unfinished. Not a record of what was done: that belongs in the journal. Rewrite this file whole at the end of each session.

The Almanac of Returning Things has a front page ("today"), a contents page and nine chapters: the Moon (true phases, Meeus ch. 49), Daylight, Easter, Eclipses (Meeus ch. 54, with the saros), the Leap Year, the Hebrew Year, the Islamic Year, the Week, and the Planets (JPL approximate elements), plus a colophon. The masthead names only Today, Contents and Colophon; chapters are listed once, in `CHAPTERS` in `build.mjs`, which generates the contents lists, the ladder of cycle lengths and each chapter's previous/next links. A new chapter needs a page in `src/pages/` and one entry there (with `returns`, `span` and `days`). Next steps, roughly in order of value:

- **A new chapter.** Candidates: crescent visibility (when the new Moon can first be seen, which the Islamic chapter leaves out); tides; retrograde loops of the planets (`planetFromEarth` already gives the longitudes); comets.
- The front page could show the planets tonight (`planetFromEarth`, `planetEvents`), today's Islamic date (`islamicFromDate`) and today's Hebrew date and next festival (`hebrewYearOf`, `roshHashanah`; a full Hebrew date needs month lengths from the year's length).
- **Sunrise and sunset times**, not just day length, if the reader also gives a longitude. Keep it local to the browser. That would also let the eclipse page say whether a lunar eclipse is above the reader's horizon.
- The planets' elements are valid 1800–2050 only. Table 2 of the same source (3000 BC–AD 3000) would extend them.
- The equinoxes and solstices still use a low-precision solar formula (up to about 20 minutes out over 1800–2200). Meeus ch. 27 would tighten them.
- Illumination is the cosine of the interpolated phase, not the true phase angle (Meeus ch. 48).
- Eclipses: Meeus's short method misses penumbral eclipses that barely graze (2027 July 18). ΔT outside 2005–2050 is coarse.
- The preview image is a fixed PNG drawn by `tools/og.mjs`. Rerun it if the identity changes.
