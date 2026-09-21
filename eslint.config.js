// FILE: eslint.config.js
// PURPOSE: Stage 1.3 — ESLint on the backend (ESM, Node) with eslint-plugin-security's
// recommended ruleset, so unsafe patterns (dynamic require/regex from user input, unsafe
// child_process/fs calls, etc.) are flagged instead of relying on manual review alone.
// Scoped to backend source only — the frontend is a separate Next.js app with its own
// `next lint` setup (tracked separately, not part of this config).

import js from '@eslint/js';
import security from 'eslint-plugin-security';
import globals from 'globals';

export default [
  {
    ignores: ['node_modules/**', 'coverage/**', 'frontend/**'],
  },
  js.configs.recommended,
  security.configs.recommended,
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    languageOptions: {
      ecmaVersion: 'latest', // needed for import-attribute syntax (`with { type: 'json' }`)
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // `_`-prefixed params are a deliberate "unused but required" marker (e.g. Express's
      // 4-arg error-handler signature, or a fetcher matching a sibling waterfall's shape).
      // `ignoreRestSiblings` covers the `const { x, ...rest } = obj` "omit x" idiom, used
      // in tests to build a payload missing one required field.
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', ignoreRestSiblings: true }],
      // Every dynamic filesystem/require path in this codebase is either a fixed,
      // developer-authored string or has already been validated upstream (e.g. seed
      // scripts, migration scripts) — the plugin's own docs note these two rules are
      // the noisiest/highest-false-positive of the set for exactly this reason.
      'security/detect-object-injection': 'off',
      'security/detect-non-literal-fs-filename': 'off',
      // `try { parse } catch {}` — "best-effort, ignore failure" — is a deliberate,
      // recurring idiom in this codebase's fallback waterfalls (diagnostics scripts,
      // provider parsing); it's not a swallowed real error.
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
];
