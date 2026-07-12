import { discoverRoot, ensureRelayDirs, writeRelay, SCHEMA_VERSION, now } from "../state.js"
import type { RelayState } from "../types.js"

export function initRelay(startDir: string, projectContext = ""): string {
  const existing = discoverRoot(startDir)
  if (existing) return `relay.json already exists at ${existing}. Edit it or run relaySave.`

  ensureRelayDirs(startDir)
  const state: RelayState = {
    schema_version: SCHEMA_VERSION,
    project_context: projectContext,
    active_baton: "",
    repos: {},
    state_snapshot: { last_session: "", open_threads: [], blockers: [] },
    spec_sync: { last_sync: "", drift: [], specs: {} },
    updated_at: now(),
  }
  writeRelay(startDir, state)
  return [
    `Initialized relay at ${startDir}/relay.json`,
    `- specs/ and .code-relay/ created`,
    `- run relaySave to register the current repo`,
  ].join("\n")
}
