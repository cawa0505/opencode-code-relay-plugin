# relay-state-model Specification

## Purpose
TBD - created by archiving change code-relay-plugin-mvp. Update Purpose after archive.

## Requirements

### Requirement: Workspace root discovery
The system SHALL locate the workspace root by walking up from the canonicalized
current directory to the nearest ancestor containing relay.json, and MUST stop at
the first project boundary encountered. Boundaries, checked nearest-first, are:
(a) a directory containing `.git`, (b) `$HOME`, (c) the filesystem root. The
system MUST NOT search past any of these boundaries; when no relay.json is found
within them it SHALL report the root as missing.

#### Scenario: Inside a child repo
- **WHEN** the plugin runs in `myrepo/src/deep` and `myrepo` has relay.json
- **THEN** it returns `myrepo`

#### Scenario: Nearest match wins
- **WHEN** both `outer` and `outer/inner` have relay.json and the plugin runs
  inside `outer/inner`
- **THEN** it returns `outer/inner`, not `outer`

#### Scenario: Git boundary is not crossed
- **WHEN** the plugin runs in `repoB/sub`, `repoB/.git` exists but `repoB` has no
  relay.json, and an ancestor of `repoB` has one
- **THEN** it reports the root as missing and MUST NOT return the ancestor

#### Scenario: Home boundary is not crossed
- **WHEN** a stray relay.json exists at `$HOME` and the caller runs in a nested
  directory below `$HOME` that has no relay.json of its own
- **THEN** it reports the root as missing and MUST NOT return `$HOME`

#### Scenario: Symlinked start path
- **WHEN** the caller's directory is reached through a symlink
- **THEN** the walk is performed from the symlink's real location

### Requirement: Global relay state schema
The system SHALL persist relay.json containing version, project_context,
active_baton, a repos map (per-repo entry), global_blockers, and
handover_template.

#### Scenario: Saving a repo snapshot
- **WHEN** relay save runs in a repo
- **THEN** relay.json.repos[<repo>] is created/updated with git hash, active_phase,
  confidence_score, debt_tag, next_session_starter, volatile_state,
  verified_modules, blockers, and spec_intent

### Requirement: Per-repo snapshot
The system SHALL write <repo>/.code-relay/state.json with git_hash, branch,
active_phase, tasks (done/in_progress/next), blockers, confidence_score,
debt_tag, verified_modules, spec_intent, and saved_at.

#### Scenario: Snapshot written
- **WHEN** relay save completes
- **THEN** .code-relay/state.json exists and parses as valid JSON

### Requirement: Rendered prompts
The system SHALL render .code-relay/RESUME.md (resume prompt) and
.code-relay/next_step.md (expanded next_session_starter) from the state.

#### Scenario: Resume prompt present
- **WHEN** state is saved or closed
- **THEN** .code-relay/RESUME.md reflects active_phase, verified modules, blockers,
  and next_session_starter
