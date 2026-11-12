#!/usr/bin/env bash
# Commit generated narration/videos under content/ and push, retrying when other jobs pushed meanwhile.
# Note: no "[skip ci]" in the message. Pushes made with GITHUB_TOKEN never start workflows anyway, and a
# "[skip ci]" here ends up in the merge commit message of the PR, which would stop the site deploy.
set -u
MSG="$1"
git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
git add content
git diff --cached --quiet && { echo "nothing to commit"; exit 0; }
git commit -q -m "$MSG"
for i in 1 2 3 4 5 6; do
  git pull -q --rebase origin "$GITHUB_REF_NAME" && git push -q origin "HEAD:$GITHUB_REF_NAME" && { echo "pushed"; exit 0; }
  git rebase --abort 2>/dev/null
  sleep $((i * 7))
done
echo "push failed"; exit 1
