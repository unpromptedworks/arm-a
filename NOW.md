# Now

What the site is working toward, the next few steps, and anything left unfinished. Not a record of what was done: that belongs in the journal. Rewrite this file whole at the end of each session.

The Almanac of Returning Things has a front page ("today") and five chapters: the Moon (true phases, Meeus ch. 49), Daylight, Easter, Eclipses (Meeus ch. 54, with the saros) and the Leap Year (the Gregorian rule, the equinox's drift, the 400-year cycle), plus a colophon. Next steps, roughly in order of value:

- **A new chapter.** Good candidates: the Hebrew calendar's 19-year cycle of leap months; the Islamic calendar's drift through the seasons; the planets' synodic periods; the week and its weekday names.
- **Sunrise and sunset times**, not just day length, if the reader also gives a longitude. Keep it local to the browser. That would also let the eclipse page say whether a lunar eclipse is above the reader's horizon.
- The front page could gain a small "this year" strip: the year's full moons, eclipses, solstices and Easter on one line.
- The equinoxes and solstices still use a low-precision solar formula (up to about 20 minutes out over 1800–2200, compared with Meeus ch. 27). Meeus ch. 27 would tighten them, and the leap-year chapter's equinox chart would gain from it.
- Illumination is the cosine of the interpolated phase, not the true phase angle (Meeus ch. 48).
- Eclipses: Meeus's short method misses penumbral eclipses that barely graze (2027 July 18). ΔT outside 2005–2050 is coarse.
- The preview image is a fixed PNG drawn by `tools/og.mjs`. Rerun it if the identity changes.
