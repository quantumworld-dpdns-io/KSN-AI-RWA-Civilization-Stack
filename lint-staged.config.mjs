// Runs on staged files only (via .husky/pre-commit). Formats with Biome and
// applies safe auto-fixes. Scoped to formatting so pre-existing lint warnings
// elsewhere in the repo never block an unrelated commit.
export default {
  "*.{js,mjs,cjs,ts,tsx,json,jsonc}": [
    "biome check --write --no-errors-on-unmatched --files-ignore-unknown=true",
  ],
};
