#!/bin/sh
# Uses only the in-memory D1 stand-in. No live API or storage calls.
set -e
D=$(mktemp -d)
trap 'rm -rf "$D"' EXIT HUP INT TERM
T=$(dirname "$0")
mkdir -p "$D/api" "$D/server" "$D/tests"
cp "$T/stub/d1-blob.js" "$D/server/d1-blob.js"
cp "$T/../api/auth.js" "$D/api/auth.js"
cp "$T/../server/class-store.js" "$D/server/class-store.js"
cp "$T/../server/marking-store.js" "$D/server/marking-store.js"
cp "$T/../server/ai-provider.js" "$D/server/ai-provider.js"
cp "$T/marking_store_test.js" "$D/tests/marking_store_test.js"
cd "$D" && node tests/marking_store_test.js
