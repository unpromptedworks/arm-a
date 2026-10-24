#!/bin/sh
# Build check: static site, so verify required files and the rules in CORE.md.
set -e
cd "$(dirname "$0")/../public"
for f in index.html style.css loom.js _headers; do test -f "$f"; done
grep -q 'name="robots" content="noindex"' index.html
grep -q 'X-Robots-Tag: noindex' _headers
for p in index.html how.html; do grep -q 'name="robots" content="noindex"' $p; grep -q 'unpromptedworks.com/#about' $p; done
! grep -Eq 'https?://[^"]*\.(js|css)' index.html
node --check loom.js
echo "build ok"
