import { discoverRoot, readRelay, listSpecs } from "../state.js"

export function statusRelay(startDir: string): string {
  const root = discoverRoot(startDir)
  if (!root) return "No relay.json found. Run relayInit first."
  const relay = readRelay(root)
  const repos = Object.values(relay.repos)
  const lines = [
    `Relay root: ${root}`,
    `Project: ${relay.project_context || "(unset)"}`,
    `Active baton: ${relay.active_baton || "(none)"}`,
    `Repos (${repos.length}):`,
    ...repos.map(
      (r) =>
        `  - ${r.name} [${r.active_phase || "?"}] conf=${r.confidence_score}` +
        (r.handoffs.length ? ` · ${r.handoffs.length} handoff(s)` : "") +
        (r.next_session_starter ? ` → ${r.next_session_starter.slice(0, 60)}` : ""),
    ),
    `Specs: ${listSpecs(root).join(", ") || "(none)"}`,
    `Drift: ${relay.spec_sync.drift.join(", ") || "(none)"}`,
    `Updated: ${relay.updated_at}`,
  ]
  return lines.join("\n")
}
