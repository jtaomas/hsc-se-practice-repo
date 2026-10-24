#!/bin/sh
# Runs api/auth.js against an in-memory stand-in for Vercel Blob. Never touches real data.
set -e
D=$(mktemp -d)
cp -r "$(dirname "$0")/stub/node_modules" "$D/"
cp "$(dirname "$0")/../api/auth.js" "$D/auth.js"
cp "$(dirname "$0")/auth_test.js" "$D/t.js"
cd "$D" && node t.js
