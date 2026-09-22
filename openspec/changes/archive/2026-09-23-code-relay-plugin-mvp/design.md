## Context

The Code Relay protocol (yan5xu/code-relay) is a file-based agent handoff
routine (HANDOFF/CHECKPOINT, SCOPE, multi-repo workspace). It works but relies on
the developer remembering to write docs and the agent knowing where to look.
This plugin automates capture, cross-repo awareness, and restoration inside
OpenCode via the @opencode-ai/plugin SDK (v1.17.18, confirmed installed).

Current repo state: OpenSpec scaffold present (config.yaml schema=spec-driven,
commands/ + skills/ for opsx-*). No plugin source yet. The plugin must register
tools (agent-callable) and a session hook, and ship slash commands mirroring
them.

## Goals / Non-Goals

**Goals:**
- Single command family `relay init|save|close|switch|resume|status`.
- Hybrid state: relay.json (root, machine) + .code-relay/state.json (per repo)
  + .code-relay/RESUME.md (rendered, agent-readable).
- Deterministic Spec Sync (no LLM) diffing specs/*.spec.md.
- Context Injector double-track: experimental.session.compacting hook + relay resume.
- Closing Ritual (relay close) completing the capture/restore loop.

**Non-Goals:**
- LLM-based spec summarization (deferred; deterministic only this MVP).
- GitHub Collaboration Mode (deferred).
- Multi-agent swarm orchestration (deferred).
- GUI beyond command palette / terminal output (deferred).

## Decisions

- **Hybrid storage (JSON + MD)** over pure JSON or pure MD: JSON is parseable by
  the plugin; MD RESUME.md is what the agent actually reads on resume.
  Alternative considered: single relay.md with YAML frontmatter — rejected for
  weaker machine parsing and harder programmatic merge.
- **Deterministic Spec Sync** over LLM: reproducible, zero token cost, no
  latency. Alternative: LLM compression — deferred as enhancement.
- **Double-track injection**: experimental.session.compacting hook (auto, stable
  today) + relay resume (manual/printable). A dedicated session-start hook, if
  added later, is additive.
- **Root discovery by walk-up** for relay.json (fallback nearest openspec/):
  no hardcoded paths; matches Code Relay's repos/ workspace convention.
- **Tools + slash commands**: tools make commands agent-callable; slash .md
  commands give the user a palette entry. Both wrap the same core functions.

## Risks / Trade-offs

- [session.compacting is the only stable hook] → Mitigation: also expose relay
  resume so restoration works even if the compaction hook is unavailable/changed.
- [Deterministic consistency check is heuristic] → Mitigation: only flags
  DONE-without-code-change; user confirms before commit; no silent auto-fix.
- [confidence_score source ambiguity] → Mitigation: CLI layer decides
  (test-derived or manual); state model just stores the number.
- [Spec Sync assumes OpenSpec spec layout] → Mitigation: scoped to
  specs/**/*.spec.md diff; ignores other markdown.
