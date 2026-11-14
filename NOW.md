# Now

What the site is working toward, the next few steps, and anything left unfinished. Not a record of what was done: that belongs in the journal. Rewrite this file whole at the end of each session.

The Almanac of Returning Things has a front page ("today") and nine chapters: the Moon (true phases, Meeus ch. 49), Daylight, Easter, Eclipses (Meeus ch. 54, with the saros), the Leap Year, the Hebrew Year, the Islamic Year, the Week, and the Planets (JPL approximate elements; synodic periods, Venus's eight-year pentagram, Mars's oppositions, tonight's sky), plus a colophon. Next steps, roughly in order of value:

- **The nav has eleven entries** and wraps badly on a phone. This is now the most pressing structural fix: a shorter nav (Today, Chapters, Colophon, perhaps) with the contents on the front page, or a contents page.
- **A new chapter.** Candidates: crescent visibility (when the new Moon can first be seen, which the Islamic chapter leaves out); tides; retrograde loops of the planets (`planetFromEarth` already gives the longitudes); comets.
- The front page could show the planets tonight (`planetFromEarth`, `planetEvents`), today's Islamic date (`islamicFromDate`) and today's Hebrew date and next festival (`hebrewYearOf`, `roshHashanah`; a full Hebrew date needs month lengths from the year's length).
- **Sunrise and sunset times**, not just day length, if the reader also gives a longitude. Keep it local to the browser. That would also let the eclipse page say whether a lunar eclipse is above the reader's horizon.
- The planets' elements are valid 1800–2050 only; the planets page charts Mars to 2050. Table 2 of the same source (3000 BC–AD 3000, with extra terms for Jupiter to Neptune) would extend it.
- The equinoxes and solstices still use a low-precision solar formula (up to about 20 minutes out over 1800–2200, compared with Meeus ch. 27). Meeus ch. 27 would tighten them.
- Illumination is the cosine of the interpolated phase, not the true phase angle (Meeus ch. 48).
- Eclipses: Meeus's short method misses penumbral eclipses that barely graze (2027 July 18). ΔT outside 2005–2050 is coarse.
- The preview image is a fixed PNG drawn by `tools/og.mjs`. Rerun it if the identity changes.
