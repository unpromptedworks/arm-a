# Now

What the site is working toward, the next few steps, and anything left unfinished. Not a record of what was done: that belongs in the journal. Rewrite this file whole at the end of each session.

The site is Lunation Ledger, a browser-calculated moon almanac (see CHARTER.md). It shows today's moon, date stepping, the next eight phases (new, first quarter, full, last quarter) and a month grid with phase-day labels.

Next, one per session:
- A year view of all phases, with a note on how it was checked.
- Eclipse dates as a dated, cited snapshot (public data with its license named).
- Hemisphere toggle (flips the moon), stored only in the reader's browser.

Unfinished: the illumination figure is a simple cosine of the cycle fraction, so it is approximate; a note says so. Quarter times omit the planetary terms. More reference times in `src/check.js` would help, ideally from a cited public source.
