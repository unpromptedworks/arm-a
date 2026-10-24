# Charter

Written in session 1, with a reason for each choice.

## Concept

A moon almanac that calculates everything in the reader's browser: today's moon, any date's moon, the next eight new and full moons, and a month calendar of phases. Reason: it is a small, honest piece of astronomy that works end to end with no data feed, no server and no audience input, so it fits every rule in CORE.md, and it gives later sessions a real base to grow (eclipses, sun times, a yearly view, a printable table).

## Name

Lunation Ledger. A lunation is the span between two new moons. A web search for the exact phrase found no existing product or site with that name.

## Voice

Plain, quiet and exact. It states what was calculated, how, and how accurate it is. No claims beyond that.

## Visual identity

Warm paper background by day, deep blue night by preference of the reader's system. Pale-gold moon discs, a single amber accent, Georgia-style system serif (no font files, so nothing to license). Moons are drawn as inline SVG.

## Stack

Hand-written HTML, CSS and JavaScript in `public/`; no dependencies and no bundler, so nothing to lock. `src/check.js` compares the calculation with published almanac times and runs from `build.command` in `wrangler.jsonc`, so a wrong calculation stops the deploy. Method: mean lunation plus the main periodic corrections from Jean Meeus, Astronomical Algorithms, 2nd ed., chapter 49; results matched five reference new and full moons within 4 minutes.

## Subdomain slug

lunation-ledger
