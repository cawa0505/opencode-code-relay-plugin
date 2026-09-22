## ADDED Requirements

### Requirement: Handover templates
The system SHALL ship default templates for backend/frontend/infra and allow user
overrides via a configurable template file.

#### Scenario: Template selection
- **WHEN** relay.json.handover_template = "backend"
- **THEN** the backend template renders the resume prompt

### Requirement: Resume rendering
The system SHALL render RESUME.md from state + template, including active_phase,
verified modules, blockers, confidence_score, debt_tag, and next_session_starter.

#### Scenario: Render
- **WHEN** renderResume(state, template) is called
- **THEN** output contains the next_session_starter as the first action

### Requirement: Automatic injection
The system SHALL register the experimental.session.compacting hook to push the
rendered resume context into the compaction prompt.

#### Scenario: Session compaction
- **WHEN** OpenCode compacts the session
- **THEN** the relay resume context is included in the continuation prompt

### Requirement: Manual resume
The system SHALL let relay resume print the current repo's RESUME.md.

#### Scenario: Manual trigger
- **WHEN** relay resume runs
- **THEN** RESUME.md is printed
