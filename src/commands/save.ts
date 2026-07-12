import { basename } from "node:path"
import { discoverRoot, updateRepo, writeRelay } from "../state.js"
import { renderResume } from "../render.js"
import type { ConfidenceScore, HandoverKind } from "../types.js"

export interface SaveArgs {
  repo?: string
  role?: string
  active_phase?: string
  volatile_state?: string
  confidence?: number
  next_session_starter?: string
  debt_tag?: string
  kind?: HandoverKind
}

export function saveRelay(startDir: string, args: SaveArgs): string {
  const root = discoverRoot(startDir)
  if (!root) return "No relay.json found. Run relayInit first."

  const repo = args.repo ?? basename(startDir)
  const patch: Record<string, unknown> = {}
  if (args.role !== undefined) patch.role = args.role
  if (args.active_phase !== undefined) patch.active_phase = args.active_phase
  if (args.volatile_state !== undefined) patch.volatile_state = args.volatile_state
  if (args.next_session_starter !== undefined) patch.next_session_starter = args.next_session_starter
  if (args.debt_tag !== undefined)
    patch.debt_tag = args.debt_tag.split(",").map((s) => s.trim()).filter(Boolean)
  if (args.confidence !== undefined)
    patch.confidence_score = Math.min(5, Math.max(1, Math.round(args.confidence))) as ConfidenceScore

  const relay = updateRepo(root, repo, patch)
  if (!relay.active_baton) {
    relay.active_baton = repo
    writeRelay(root, relay)
  }

  const rendered = renderResume(root, repo, args.kind ?? "backend")
  return `Saved state for "${repo}".\nActive baton: ${relay.active_baton}\n\n${rendered}`
}
