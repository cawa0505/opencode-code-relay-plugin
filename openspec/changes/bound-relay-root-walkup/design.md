# Design: Bound relay root walk-up

## Context
`discoverRoot(start)` currently loops to the filesystem root. The plugin assumes a
single workspace root per project, but nothing enforces that assumption, so an
ancestor file silently becomes the root.

## Decision
Bound the walk at the first of three boundaries, evaluated after the relay.json
check so the nearest match always wins:

```
for (;;) {
  if (relay.json here) return dir
  if (.git here) break        // project boundary
  if (dir === $HOME) break    // absolute upper bound
  parent = dirname(dir)
  if (parent === dir) break   // fs root
  dir = parent
}
```

Rationale:
- **`.git` boundary** — a relay root belongs to a repository. Subdirectories still
  reach their own repo's relay.json, but a repo without one no longer adopts a
  neighbour's. This is the boundary that matches the mental model "my project's
  relay".
- **`$HOME` boundary** — a belt-and-braces upper bound for directories that are
  not git repos at all, so a stray file high in the tree can never capture an
  unrelated caller.
- **Canonicalize the start** — a symlinked cwd (e.g. `~/Projects/x` →
  `/mnt/.../x`) otherwise produces a boundary comparison against the wrong path.

## Alternatives rejected
- **Stop at the nearest `.git` only.** Leaves non-git directories unbounded.
- **Stop at `$HOME` only.** Allows a monorepo-style shared relay above several
  sibling git repos, which is exactly the ambiguous case that caused confusion;
  a shared relay should be explicit (init at that level), not inherited by
  accident.
- **Configuration knob for the boundary.** No caller needs a different policy;
  YAGNI.

## Compatibility
Both implementations — this TypeScript plugin and the Rust
`graphify-plugin-handoff` crate used by the `graphify` CLI/MCP — implement the same
discover procedure and both carried the same unbounded walk. They are updated
together so the two entry points agree.
