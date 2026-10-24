#!/bin/sh
# Uses only the existing in-memory Blob stand-in. No live API or storage calls.
set -e
D=$(mktemp -d)
trap 'rm -rf "$D"' EXIT HUP INT TERM
mkdir -p "$D/node_modules/@vercel/blob" "$D/api" "$D/server" "$D/tests"
cp "$(dirname "$0")/stub/blob/"* "$D/node_modules/@vercel/blob/"
cp "$(dirname "$0")/../api/auth.js" "$D/api/auth.js"
cp "$(dirname "$0")/../server/marking-store.js" "$D/server/marking-store.js"
cp "$(dirname "$0")/marking_store_test.js" "$D/tests/marking_store_test.js"
cd "$D" && node tests/marking_store_test.js
