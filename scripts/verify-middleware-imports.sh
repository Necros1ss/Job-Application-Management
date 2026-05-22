#!/usr/bin/env bash
set -euo pipefail

if grep -R "from.*middleware/auth" backend/src/routes/; then
  echo "Found imports from backend/src/middleware/auth.js. Use backend/src/middlewares/auth.js instead." >&2
  exit 1
fi

echo "Middleware imports are using backend/src/middlewares/."
