#!/bin/bash
# Install canonical git hooks into .git/hooks/
set -e
ROOT=$(git rev-parse --show-toplevel)
cp -v "$ROOT/ops/git-hooks/pre-commit" "$ROOT/.git/hooks/pre-commit"
chmod +x "$ROOT/.git/hooks/pre-commit"
echo "✓ pre-commit hook installed"
