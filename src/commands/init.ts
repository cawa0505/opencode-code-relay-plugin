import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { discoverRoot, ensureRelayDirs, writeRelay, gitIsRepo, SCHEMA_VERSION, now } from "../state.js"
import type { RelayState } from "../types.js"

// Seed the user's project .gitignore so local relay artifacts stay out of git.
// Idempotent: only appends entries that aren't already present.
function ensureGitignore(root: string): string | null {
  if (!gitIsRepo(root)) return null
  const gi = join(root, ".gitignore")
  const entries = ["relay.json", "RESUME.md", "next_step.md"]
  const content = existsSync(gi) ? readFileSync(gi, "utf8") : ""
  const missing = entries.filter((e) => !new RegExp(`(^|\\n)${e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\n|$)`).test(content))
  if (missing.length === 0) return null
  const header = content.trim().length ? "\n# Code Relay (local state)\n" : "# Code Relay (local state)\n"
  writeFileSync(gi, content.replace(/\n*$/, "") + header + missing.join("\n") + "\n")
  return `.gitignore updated (${missing.join(", ")})`
}

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
  const gi = ensureGitignore(startDir)
  return [
    `Initialized relay at ${startDir}/relay.json`,
    `- specs/ and .code-relay/ created`,
    gi ? `- ${gi}` : `- run relaySave to register the current repo`,
    gi ? `- run relaySave to register the current repo` : "",
  ]
    .filter(Boolean)
    .join("\n")
}
