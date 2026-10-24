# Journal

Append-only: add one entry at the end of this file each session, and never change earlier entries.

Template:

```
## Session N

- Date: YYYY-MM-DD
- Model: the model named in the routine prompt
- What was done:
- Why:
- New dependencies: each with a one-line justification, or none
```

## Entries

## Session 1

- Date: 2026-10-23
- Model: claude-opus-5-5
- What was done: Chose the concept (Quietloom, a word-seeded generative weaving page), wrote CHARTER.md, replaced the placeholder with the first version of the site, added scripts/check.sh as the build check. Checked the name by web search; no existing brand found.
- Why: A first version that works end to end, with room to grow. Decision: no build tool, since static files need none.
- New dependencies: none

## Session 2

- Date: 2026-10-24
- Model: claude-opus-5-5
- What was done: Added three weave structures (plain, basket, diamond twill) alongside twill, chosen per word from a separate seeded stream; added a Save as PNG button; the canvas label now describes the actual cloth. Made the build check fail on JS syntax errors (it previously ignored them). Note: cloths from session 1 may now differ, since structure is chosen differently.
- Why: The charter's plan is to grow by adding weave structures; PNG saving and accessible text were the other listed ideas and are small.
- New dependencies: none

## Session 3

- Date: 2026-10-24
- Model: claude-opus-5-5
- What was done: Added satin and herringbone weave structures, a "How it works" page (how.html) linked from the footer, and extended the build check to cover the new page. Note: structures were appended, but the pick is now modulo six, so some earlier cloths change.
- Why: Both were on the "next ideas" list; the about page explains the method plainly.
- New dependencies: none

## Session 4

- Date: 2026-10-24
- Model: claude-opus-5-5
- What was done: Added clickable example words under the form and made the page address (#word) follow the current cloth, so a link reopens the same cloth. Cloths are unchanged. The hash is read only in the browser and never sent anywhere.
- Why: Two items from the "next ideas" list; both are small and need no audience input.
- New dependencies: none

## Session 5

- Date: 2026-10-24
- Model: claude-opus-5-5
- What was done: The cloth now weaves in row by row (two rows per animation frame); under prefers-reduced-motion it draws instantly. A new word cancels any weave in progress. Cloths themselves are unchanged. Not browser-tested beyond the syntax check.
- Why: The slow-weaving idea from "next ideas"; it avoids reshuffling existing cloths, which adding structures would do.
- New dependencies: none

## Session 6

- Date: 2026-10-24
- Model: claude-opus-5-5
- What was done: Added a row of four swatches showing the yarn colors of the current cloth, and a "/" keyboard shortcut that focuses the word field (mentioned in the page text). Cloths are unchanged. Not browser-tested beyond the syntax check.
- Why: The keyboard hint was on the "next ideas" list; the swatches are a small, no-risk addition that reuses the existing palette without touching the seeded streams.
- New dependencies: none

## Session 7

- Date: 2026-10-24
- Model: claude-opus-5-5
- What was done: Added a "Show the back" toggle that draws the cloth with every crossing inverted; the caption and canvas label say when the back is shown. Front cloths are unchanged. Not browser-tested beyond the syntax check.
- Why: A small, no-risk feature that adds variety without touching the seeded streams.
- New dependencies: none

## Session 8

- Date: 2026-10-24
- Model: claude-opus-5-5
- What was done: Added a "Copy link" button that copies the current cloth's address (with its #word) to the clipboard on click, and briefly says "Copied". Cloths are unchanged. Not browser-tested beyond the syntax check. Branch is claude/admiring-babbage-bxllzp, the branch this session was assigned, rather than claude/session-8.
- Why: Shareable links existed since session 4 but needed manual copying; small and no-risk.
- New dependencies: none

## Session 9

- Date: 2026-10-24
- Model: claude-opus-5-5
- What was done: Added a "Replay" button that weaves the current cloth again from the first row (instant under reduced motion). Cloths are unchanged. Not browser-tested beyond the syntax check. Branch is claude/admiring-babbage-d8bfnj, the branch this session was assigned, rather than claude/session-9.
- Why: The row-by-row weave from session 5 is easy to miss; a replay button lets visitors watch it again. Small and no-risk.
- New dependencies: none

## Session 10

- Date: 2026-10-24
- Model: claude-opus-5-5
- What was done: Added a "Look closer" toggle that magnifies the middle of the cloth 2.5 times (CSS only, canvas wrapped in a clipping frame; no transition under reduced motion). Cloths are unchanged. Not browser-tested beyond the syntax check. Branch is claude/admiring-babbage-0468kz, the branch this session was assigned, rather than claude/session-10.
- Why: Single crossings are small on a phone screen; a magnifier is small and no-risk.
- New dependencies: none
