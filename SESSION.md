# Session instructions

Make a website. Do whatever you want with it.

This repository is your only memory between sessions: each session starts by reading it and ends by updating it. `CORE.md` holds the rules every session follows.

The operator merges every pull request that keeps the rules in `CORE.md`. Pull requests are never closed for taste.

## Every session

1. Record the start time with `date -u` and the effort level with `echo $CLAUDE_EFFORT`. Read `CORE.md`, `CHARTER.md`, the last several entries of `JOURNAL.md`, `NOW.md` and `EDITOR.md`.
2. Check for an open pull request from an earlier session: `gh api "repos/OWNER/REPO/pulls?state=open"`, with OWNER/REPO taken from `git remote get-url origin`. Count only pull requests whose head branch starts with `claude/`. If one is open, end the session without changes.
3. Your session number is the last journal entry's number plus one. If the journal has no entries, this is session 1: also follow "Session 1" below.
4. Choose one piece of work and finish it in this session: a new piece, a new feature, a change to the site's design or structure, or a substantial fix. One, not several, and not a tweak. Research on the web as needed. Open the pull request (step 8) within about 45 minutes of the time you recorded in step 1.
5. Build the site; the build must pass.
6. Run `look` on every page you changed (`look --help` says how) and view each screenshot with your Read tool. Fix anything broken. If `look` is missing, say so in the journal and go on; install no browser yourself.
7. Run `date -u` for the end time, then add a journal entry, using the template in `JOURNAL.md`, and rewrite `NOW.md`.
8. Commit to the branch this session was given (its name starts with `claude/`; if you were given none, create `claude/session-N`), push it, and open a pull request with the REST API: `gh api repos/OWNER/REPO/pulls -f title="..." -f head=BRANCH -f base=main -f body="..."`, with BRANCH from `git branch --show-current`. `gh pr` does not work in this environment. The description says what you did and what comes next.
9. Wait for the Cloudflare check run on the pull request's head commit. The environment blocks a bare `sleep`, so wait with one polling command, run with the Bash tool's timeout set to 600000 milliseconds: `timeout 540 sh -c "until gh api repos/OWNER/REPO/commits/SHA/check-runs --jq '.check_runs[].status' | grep -q completed; do sleep 20; done"`. Then read the result with `gh api repos/OWNER/REPO/commits/SHA/check-runs`. If it fails, fix the cause and push again, at most twice. If no check run appears within 10 minutes of a push, push one empty commit to start the build again. If the check still fails or never appears, say so in the pull request description and the journal entry.

Never merge a pull request; the operator merges.

No one reads this session while it runs. Never wait for an answer: decide, record the decision and its reason in the journal, and continue.

## Session 1

Session 1 is not limited to one piece of work, and has about 90 minutes instead of 45. Choose the site's concept, name, voice, visual identity and stack, and write them into `CHARTER.md` with your reasons. Build a first version with the concept working end to end and enough in it to show what the site is. It replaces the placeholder in `public/`; if your build writes somewhere else, point `wrangler.jsonc` there and keep the `_headers` file in the output.

Propose a subdomain slug in `CHARTER.md` and in the pull request: lowercase letters, digits and hyphens; not a real brand, a person's name, or a reserved name such as `www`, `mail` or `admin`. The operator maps it to `SLUG.unpromptedworks.com` after the pull request merges.
