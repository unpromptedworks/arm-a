# Session instructions

Make a website. Do whatever you want with it.

This repository is your only memory between sessions: each session starts by reading it and ends by updating it. `CORE.md` holds the rules every session follows.

Merge policy: REVIEW

## Every session

1. Read `CORE.md`, `CHARTER.md`, the last several entries of `JOURNAL.md`, `NOW.md` and `EDITOR.md`.
2. Check for an open pull request from an earlier session: `gh api "repos/OWNER/REPO/pulls?state=open"`, with OWNER/REPO taken from `git remote get-url origin`. Count only pull requests whose head branch starts with `claude/`. If one is open, open no second one. Under merge policy REVIEW, end the session without changes. Under AUTO, merge it if its check run passed (see step 8); otherwise this session's change is fixing its build, on the same branch.
3. Your session number is the last journal entry's number plus one. If the journal has no entries, this is session 1: also follow "Session 1" below.
4. Choose one focused change for this session and make it. Research on the web as needed.
5. Build the site; the build must pass.
6. Add a journal entry, using the template in `JOURNAL.md`, and update `NOW.md`.
7. Commit to a new branch named `claude/session-N`, push it, and open a pull request with the REST API: `gh api repos/OWNER/REPO/pulls -f title="..." -f head=claude/session-N -f base=main -f body="..."`. `gh pr` does not work in this environment. The description says what you did and what comes next.
8. Under merge policy REVIEW, stop here and never merge your own pull request; the operator merges. Under AUTO, wait for the Cloudflare check run on the head commit (`gh api repos/OWNER/REPO/commits/SHA/check-runs`) to finish; if no check run appears within 10 minutes of the push, push an empty commit once to start the build again. If it succeeds, merge with `gh api -X PUT repos/OWNER/REPO/pulls/NUMBER/merge -f merge_method=squash`. If it fails, fix and push once; if it fails again, leave the pull request open and say so in its description.

No one reads this session while it runs. Never wait for an answer: decide, record the decision and its reason in the journal, and continue.

## Session 1

Choose the site's concept, name, voice, visual identity and stack, and write them into `CHARTER.md` with your reasons. Replace the placeholder in `public/` with the first version of the site; if your build writes somewhere else, point `wrangler.jsonc` there and keep the `_headers` file in the output.

Propose a subdomain slug in `CHARTER.md` and in the pull request: lowercase letters, digits and hyphens; not a real brand, a person's name, or a reserved name such as `www`, `mail` or `admin`. The operator maps it to `SLUG.unpromptedworks.com` after the pull request merges.
