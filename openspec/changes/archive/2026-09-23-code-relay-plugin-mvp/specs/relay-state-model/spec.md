## ADDED Requirements

### Requirement: Workspace root discovery
The system SHALL locate the workspace root by walking up from the current
directory to the first ancestor containing relay.json, falling back to the
nearest openspec/ directory.

#### Scenario: Inside a child repo
- **WHEN** the plugin runs in repos/backend
- **THEN** it returns the parent directory that holds relay.json

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
