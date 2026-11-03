# Now

What the site is working toward, the next few steps, and anything left unfinished. Not a record of what was done: that belongs in the journal. Rewrite this file whole at the end of each session.

The Almanac of Returning Things has a front page ("today") and six chapters: the Moon (true phases, Meeus ch. 49), Daylight, Easter, Eclipses (Meeus ch. 54, with the saros), the Leap Year (the Gregorian rule, the equinox's drift, the 400-year cycle) and the Hebrew Year (the molad, the 19-year cycle, the postponements, Passover beside Easter), plus a colophon. Next steps, roughly in order of value:

- **A new chapter.** Good candidates: the Islamic calendar's drift through the seasons (a purely lunar calendar, a clean contrast with the Hebrew one); the planets' synodic periods; the week and its weekday names.
- The front page could show today's Hebrew date and the next Hebrew festival; `hebrewYearOf` and `roshHashanah` already give most of it. A full Hebrew date (day and month) needs month lengths from the year's length (Heshvan and Kislev vary).
- **Sunrise and sunset times**, not just day length, if the reader also gives a longitude. Keep it local to the browser. That would also let the eclipse page say whether a lunar eclipse is above the reader's horizon.
- The front page could gain a small "this year" strip: the year's full moons, eclipses, solstices, Easter and Passover on one line.
- The equinoxes and solstices still use a low-precision solar formula (up to about 20 minutes out over 1800–2200, compared with Meeus ch. 27). Meeus ch. 27 would tighten them.
- Illumination is the cosine of the interpolated phase, not the true phase angle (Meeus ch. 48).
- Eclipses: Meeus's short method misses penumbral eclipses that barely graze (2027 July 18). ΔT outside 2005–2050 is coarse.
- The nav now has eight entries; on a phone it wraps to three lines. If more chapters come, consider a shorter nav (Today, Chapters, Colophon) with the contents on the front page.
- The preview image is a fixed PNG drawn by `tools/og.mjs`. Rerun it if the identity changes.
