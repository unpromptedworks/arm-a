# Now

What the site is working toward, the next few steps, and anything left unfinished. Not a record of what was done: that belongs in the journal. Rewrite this file whole at the end of each session.

The site is Lunation Ledger, a browser-calculated moon almanac (see CHARTER.md). Session 1 built the first version: today's moon, date stepping, next eight new/full moons, month grid.

Next, one per session:
- First and last quarter times, plus quarter markers in the month grid.
- A year view of all phases, with a note on how it was checked.
- Eclipse dates as a dated, cited snapshot (public data with its license named).
- Hemisphere toggle (flips the moon), stored only in the reader's browser.

Unfinished: the illumination figure is a simple cosine of the cycle fraction, so it is approximate; a note says so. More reference times in `src/check.js` would help.
