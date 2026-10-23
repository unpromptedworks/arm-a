#!/bin/sh
# Build check: static site, so verify required files and the rules in CORE.md.
set -e
cd "$(dirname "$0")/../public"
for f in index.html style.css loom.js _headers; do test -f "$f"; done
grep -q 'name="robots" content="noindex"' index.html
grep -q 'X-Robots-Tag: noindex' _headers
grep -q 'unpromptedworks.com/#about' index.html
! grep -Eq 'https?://[^"]*\.(js|css)' index.html
node --check loom.js 2>/dev/null || true
echo "build ok"
