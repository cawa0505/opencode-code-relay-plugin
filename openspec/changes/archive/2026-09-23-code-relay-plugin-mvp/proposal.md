# Change: Code Relay Plugin MVP

## Why
AI coding agents lose context across sessions and across repositories. The Code
Relay protocol (yan5xu/code-relay) solves this with a manual Markdown/YAML
handoff routine, but it depends on the developer remembering to write HANDOFF
docs and the agent knowing where to look. This change automates that protocol as
an OpenCode plugin so state capture, cross-repo awareness, and context
restoration happen with single commands plus a session hook.

## What Changes
- Add an OpenCode plugin (@opencode-ai/plugin, TypeScript) exposing a relay
  command family: init, save, close, switch, resume, status.
- Introduce a hybrid state model: machine-readable relay.json at the workspace
  root, per-repo .code-relay/state.json, and a rendered .code-relay/RESUME.md.
- Implement a deterministic Spec Sync engine that diffs child-repo
  specs/*.spec.md and compresses intent into the root state (no LLM call).
- Add a Context Injector that renders a Resume Prompt from state + handover
  templates, injected via the experimental.session.compacting hook and via
  relay resume (double-track).
- Add the relay close Closing Ritual: consistency check, delta snapshot,
  next_step.md, atomic commit.

## Impact
- New artifacts: plugin source under src/, package.json opencode extension
  config, relay.json at workspace root, .code-relay/* per repo.
- Assumes an OpenCode workspace where repos live under a common root (Code
  Relay's repos/ convention). Root is discovered by walking up from cwd to the
  first directory containing relay.json (fallback: nearest openspec/).
- Non-goals (deferred): LLM-based spec summarization, GitHub Collaboration Mode,
  multi-agent swarm orchestration, a graphical UI beyond command palette.
