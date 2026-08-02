#!/usr/bin/env bash
# Package the addon/ folder into an installable .xpi file.
# Usage: ./build.sh
set -euo pipefail

cd "$(dirname "$0")"

VERSION=$(grep '"version"' addon/manifest.json | head -1 | sed -E 's/.*"version"[^"]*"([^"]+)".*/\1/')
OUT="build/zotero-plugin-${VERSION}.xpi"

mkdir -p build
rm -f "$OUT"

# An .xpi is just a zip of the addon contents (manifest.json at the root).
( cd addon && zip -r -FS "../$OUT" . -x '*.DS_Store' )

echo "Built $OUT"
