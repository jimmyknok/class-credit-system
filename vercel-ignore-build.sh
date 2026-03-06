#!/bin/bash

echo "Current branch: $VERCEL_GIT_COMMIT_REF"

if [[ "$VERCEL_GIT_COMMIT_REF" == "html-v3" ]]; then
  echo "✅ Allowed: html-v3 branch → proceed with build"
  exit 1
else
  echo "🛑 Ignored: not html-v3 → skip build"
  exit 0
fi
