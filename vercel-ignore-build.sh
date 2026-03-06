#!/bin/bash

echo "Current branch: $VERCEL_GIT_COMMIT_REF"

if [[ "$VERCEL_GIT_COMMIT_REF" == "main" ]]; then
  echo "✅ Allowed: main branch → proceed with build"
  exit 1  # 继续构建
else
  echo "🛑 Ignored: not main → skip build"
  exit 0  # 跳过构建
fi
