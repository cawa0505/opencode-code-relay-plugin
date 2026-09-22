# Change: Bound relay root walk-up to the project boundary

## Why
`discoverRoot` walks up from the current directory to the filesystem root with no
boundary. Any stray `relay.json` above a repo — most commonly a leftover in
`$HOME` — is silently picked up as the relay root. In practice this made ~20
unrelated projects share one `relay.json`, so `active_baton` and
`project_context` were overwritten by whichever session saved last, and
`relay status` / `relay resume` reported the wrong project with no error.

The look-up must stay bounded to the project the caller is actually working in.

## What Changes
- `discoverRoot` stops at the following boundaries (nearest match wins first):
  1. a directory containing `.git` — do not cross a git repo boundary;
  2. `$HOME` — absolute upper bound;
  3. the filesystem root.
- The start path is canonicalized before walking, so a symlinked working
  directory resolves against its real location.
- Add a runnable self-check covering the boundary cases, since the package has
  no test framework today.

## Impact
- Modified: `src/state.ts` (`discoverRoot`).
- Added: `src/state.test.mjs` + `check` npm script.
- Behavioural: a repo without its own `relay.json` now fails fast with
  `No relay.json found. Run relayInit first.` instead of adopting an ancestor's
  file. Callers that relied on the unbounded fallback (none in-tree) would need
  to be given an explicit root.
