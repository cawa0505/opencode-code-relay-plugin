## ADDED Requirements

### Requirement: Spec diffing
The system SHALL compute the working-tree diff of specs/**/*.spec.md versus the
last committed version for a repo.

#### Scenario: Specs edited
- **WHEN** specs/ has uncommitted changes
- **THEN** the diff lists added/changed/removed requirement files

### Requirement: Intent extraction
The system SHALL extract requirement titles, WHY sections, and status markers
from specs and compress them into a spec_intent string stored in relay state.

#### Scenario: Extract after save
- **WHEN** relay save runs Spec Sync
- **THEN** relay.json.repos[<repo>].spec_intent summarizes the specs

### Requirement: Consistency check
The system SHALL detect when a spec requirement is marked DONE but the
corresponding source files have no changes (or vice versa) and flag it.

#### Scenario: Drift detected
- **WHEN** a DONE requirement has no related code change
- **THEN** relay close prompts the user to reconcile specs before commit
