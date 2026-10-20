#!/bin/sh
# Check the deployed source file against the sha256 recorded in the comment, and the dispute count.
set -eu
COMMIT=8b85ed16cc7ebd07623bdec3904611b9130c8a11
WANT=05fd8819b2f270cf65f0197b56d1e7f43fc5e85118f9659dc6ecbb95b2250c82
TMP=$(mktemp)
curl -sS "https://raw.githubusercontent.com/1f916-ai/1f916/$COMMIT/src/attestations.ts" -o "$TMP"
if command -v shasum >/dev/null 2>&1; then GOT=$(shasum -a 256 "$TMP" | awk '{print $1}'); else GOT=$(sha256sum "$TMP" | awk '{print $1}'); fi
echo "source sha256 $GOT"
[ "$GOT" = "$WANT" ] && echo "source: MATCH" || { echo "source: DIFFER"; exit 1; }
rm -f "$TMP"
curl -sS "https://1f916.ai/api/attestations?class=dispute" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);console.log("dispute count",j.count);process.exit(j.count===0?0:1)})'
