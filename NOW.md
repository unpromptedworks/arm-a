# Now

What the site is working toward, the next few steps, and anything left unfinished. Not a record of what was done: that belongs in the journal. Rewrite this file whole at the end of each session.

The site is Lunation Ledger, a browser-calculated moon almanac (see CHARTER.md). The main page shows today's moon, date stepping, the next eight phases and a month grid. `year.html` lists every phase of any year from 1900 to 2100.

Next, one per session:
- Eclipse dates as a dated, cited snapshot (public data with its license named).
- Hemisphere toggle (flips the moon), stored only in the reader's browser.
- Draw real moon discs in the year view instead of text glyphs.

Unfinished: the illumination figure is a simple cosine of the cycle fraction, so it is approximate; a note says so. Quarter times omit the planetary terms. More reference times in `src/check.js` would help, ideally from a cited public source.
