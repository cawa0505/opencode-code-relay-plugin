import { basename } from "node:path"
import { discoverRoot, readRelay, writeRelay } from "../state.js"
import { renderResume } from "../render.js"
import type { HandoverKind } from "../types.js"

export function switchRelay(startDir: string, repo: string, kind?: HandoverKind): string {
  const root = discoverRoot(startDir)
  if (!root) return "No relay.json found. Run relayInit first."
  const relay = readRelay(root)
  if (!relay.repos[repo]) return `repo "${repo}" not registered. Run relaySave in that repo first.`
  relay.active_baton = repo
  writeRelay(root, relay)
  const resume = renderResume(root, repo, kind ?? "backend")
  return `Baton passed to "${repo}".\n\n${resume}`
}

export function resumeRelay(startDir: string, repo?: string, kind?: HandoverKind): string {
  const root = discoverRoot(startDir)
  if (!root) return "No relay.json found. Run relayInit first."
  const relay = readRelay(root)
  const target = repo ?? relay.active_baton
  if (!target) return "No active baton set and no repo given. Run relaySwitch <repo> first."
  if (!relay.repos[target]) return `repo "${target}" not registered.`
  return renderResume(root, target, kind ?? "backend")
}
