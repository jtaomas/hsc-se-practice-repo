#!/bin/sh
# Runs api/auth.js against an in-memory stand-in for Vercel Blob. Never touches real data.
set -e
node "$(dirname "$0")/auth_storage_transport_test.js"
D=$(mktemp -d)
trap 'rm -rf "$D"' EXIT HUP INT TERM
mkdir -p "$D/node_modules/@vercel/blob"
cp "$(dirname "$0")/stub/blob/"* "$D/node_modules/@vercel/blob/"
cp "$(dirname "$0")/../api/auth.js" "$D/auth.js"
cp "$(dirname "$0")/auth_test.js" "$D/t.js"
cd "$D" && node t.js
