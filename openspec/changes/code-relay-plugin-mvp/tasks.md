## 1. Project scaffold

- [x] 1.1 Init plugin package.json with @opencode-ai/plugin dep + opencode extension field
- [x] 1.2 Add tsconfig + build script; wire src/index.ts exporting the Plugin

## 2. Relay Core (relay-state-model)

- [x] 2.1 Implement discoverRoot(cwd) walk-up for relay.json
- [x] 2.2 Implement readRelay() / writeRelay() with schema validation
- [x] 2.3 Implement per-repo state.json read/write (saveState, loadState)
- [x] 2.4 Implement RESUME.md + next_step.md writers from a state object

## 3. Spec Sync engine (spec-sync)

- [x] 3.1 Implement diffSpecs(repoDir) working-tree vs last commit
- [x] 3.2 Implement extractIntent(specs) compressing requirement titles/WHY/status
- [x] 3.3 Implement consistencyCheck(specs, src) heuristic (DONE-vs-change)
- [x] 3.4 Unit-test diff/extract with sample specs

## 4. CLI / Tools (relay-cli)

- [x] 4.1 Register tool.relayInit + slash relay-init.md
- [x] 4.2 Register tool.relaySave + slash; snapshot + sync + render
- [x] 4.3 Register tool.relayClose + slash; 4-step Closing Ritual
- [x] 4.4 Register tool.relaySwitch <repo> + slash; move baton, load specs
- [x] 4.5 Register tool.relayResume + slash; print RESUME.md
- [x] 4.6 Register tool.relayStatus + slash; condensed print

## 5. Context Injector (context-injector)

- [x] 5.1 Implement handover template loader (backend/frontend/infra defaults + user overrides)
- [x] 5.2 Implement renderResume(state, template)
- [x] 5.3 Wire experimental.session.compacting hook to push rendered context
- [x] 5.4 Add template customization docs

## 6. Packaging & verify

- [x] 6.1 opencode plugin add local install smoke test
- [x] 6.2 End-to-end: init -> save -> close -> switch -> resume in a sample workspace
- [x] 6.3 README + usage examples

<!--
Verification status (2026-07-12):
- `npm run build` passes (tsc + template copy), 0 type errors.
- Node-level e2e smoke test passed: init -> save -> status -> close -> resume,
  plus plugin entry wiring (6 tools + compacting hook push context).
- Remaining manual step before publish: run `opencode plugin add .` in a real
  session and exercise /relay-* once, to confirm opencode-host integration.
-->
