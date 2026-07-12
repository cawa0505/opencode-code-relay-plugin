## ADDED Requirements

### Requirement: relay init
The system SHALL create relay.json at the workspace root and capture
project_context.

#### Scenario: Fresh workspace
- **WHEN** relay init runs with no relay.json
- **THEN** a valid relay.json with version 1 is created and project_context is set

### Requirement: relay save
The system SHALL snapshot the current repo to .code-relay/state.json, update the
root relay.json entry, run Spec Sync, and render RESUME.md.

#### Scenario: Save in a repo
- **WHEN** relay save runs
- **THEN** state.json, relay.json entry, and RESUME.md are all updated

### Requirement: relay close (Closing Ritual)
The system SHALL run four ordered steps: (1) consistency check of specs vs code,
(2) delta snapshot (changed/broke/confidence), (3) write next_step.md, (4)
atomically commit relay.json + specs/ + .code-relay/ with a session-end tag.

#### Scenario: Stale specs detected
- **WHEN** a requirement is DONE but no code change exists
- **THEN** the user is prompted to update specs before committing

#### Scenario: Ritual completes
- **WHEN** all steps pass
- **THEN** a git commit with session-end tag exists and the terminal shows a
  sealed summary line

### Requirement: relay switch
The system SHALL move active_baton to the named repo, load its specs/ as context,
and prompt to update global relay state.

#### Scenario: Switch repo
- **WHEN** relay switch backend runs
- **THEN** active_baton.repo = "backend" and backend specs are loaded as context

### Requirement: relay resume
The system SHALL print the current repo's RESUME.md to the user/agent.

#### Scenario: Resume printed
- **WHEN** relay resume runs
- **THEN** the rendered resume prompt is output

### Requirement: relay status
The system SHALL print a condensed view of relay.json.

#### Scenario: Status printed
- **WHEN** relay status runs
- **THEN** active_baton, per-repo phases, and blockers are shown
