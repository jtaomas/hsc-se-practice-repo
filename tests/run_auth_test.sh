#!/bin/sh
# Runs api/auth.js against an in-memory stand-in for the D1 storage module. Never touches real data.
set -e
D=$(mktemp -d)
trap 'rm -rf "$D"' EXIT HUP INT TERM
T=$(dirname "$0")
mkdir -p "$D/api" "$D/server"
cp "$T/stub/d1-blob.js" "$D/server/d1-blob.js"
cp "$T/../api/auth.js" "$D/api/auth.js"
cp "$T/../server/class-store.js" "$D/server/class-store.js"
cp "$T/auth_test.js" "$D/t.js"
cd "$D" && node t.js ./api/auth.js
