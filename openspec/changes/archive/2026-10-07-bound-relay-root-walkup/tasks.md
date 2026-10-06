## 1. Bound the walk

- [x] 1.1 `discoverRoot`: canonicalize start, stop at `.git` / `$HOME` / fs root
- [x] 1.2 Keep nearest-match precedence (relay.json checked before boundaries)

## 2. Verify

- [x] 2.1 Add `src/state.test.mjs` self-check covering: nearest wins, git boundary, home boundary, symlinked start, no-root
- [x] 2.2 Wire a `check` npm script and run it
- [x] 2.3 `npm run typecheck` passes

## 3. Docs

- [x] 3.1 Note the boundary rule in README (root discovery section)
- [x] 3.2 `openspec validate bound-relay-root-walkup --strict` passes
