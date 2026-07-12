import { execSync } from "node:child_process"
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "node:fs"
import { join, resolve, basename, dirname } from "node:path"
import type { HandoffEntry, RelayState, RepoState } from "./types.js"

export const RELAY_FILE = "relay.json"
export const SCHEMA_VERSION = "1.0.0"

export function now(): string {
  return new Date().toISOString()
}

/** Walk up from `start` to find the directory that contains relay.json. */
export function discoverRoot(start: string): string | null {
  let dir = resolve(start)
  // ponytail: bounded walk, stop at fs root
  for (;;) {
    if (existsSync(join(dir, RELAY_FILE))) return dir
    const parent = dirname(dir)
    if (parent === dir) return null
    dir = parent
  }
}

export function readRelay(root: string): RelayState {
  const p = join(root, RELAY_FILE)
  if (!existsSync(p)) {
    throw new Error(`relay.json not found in ${root}. Run relayInit first.`)
  }
  return JSON.parse(readFileSync(p, "utf8")) as RelayState
}

export function writeRelay(root: string, state: RelayState): void {
  state.updated_at = now()
  mkdirSync(root, { recursive: true })
  writeFileSync(join(root, RELAY_FILE), JSON.stringify(state, null, 2) + "\n", "utf8")
}

export function loadState(root: string, repo: string): RepoState | null {
  const relay = readRelay(root)
  return relay.repos[repo] ?? null
}

export function updateRepo(root: string, repo: string, patch: Partial<RepoState>): RelayState {
  const relay = readRelay(root)
  const prev = relay.repos[repo] ?? {
    name: repo,
    path: repo,
    role: "",
    active_phase: "",
    volatile_state: "",
    confidence_score: 3 as const,
    debt_tag: [],
    next_session_starter: "",
    handoffs: [],
    last_updated: "",
  }
  const next: RepoState = { ...prev, ...patch, name: repo, last_updated: now() }
  relay.repos[repo] = next
  writeRelay(root, relay)
  return relay
}

export function addHandoff(root: string, repo: string, source: string, raw: string): RelayState {
  const relay = readRelay(root)
  if (!relay.repos[repo]) {
    relay.repos[repo] = {
      name: repo,
      path: repo,
      role: "",
      active_phase: "",
      volatile_state: "",
      confidence_score: 3,
      debt_tag: [],
      next_session_starter: "",
      handoffs: [],
      last_updated: now(),
    }
  }
  const r = relay.repos[repo]
  const entry: HandoffEntry = { source, captured_at: now(), raw }
  r.handoffs = [...(r.handoffs ?? []), entry]
  // ponytail: naive line parse into open_threads, deduped against existing
  const seen = new Set(relay.state_snapshot.open_threads)
  for (const line of raw.split("\n").map((l) => l.trim()).filter(Boolean)) {
    if (!seen.has(line)) {
      relay.state_snapshot.open_threads.push(line)
      seen.add(line)
    }
  }
  writeRelay(root, relay)
  return relay
}

export function ensureRelayDirs(root: string): void {
  mkdirSync(join(root, "specs"), { recursive: true })
  mkdirSync(join(root, ".code-relay"), { recursive: true })
}

// --- git helpers (best-effort; degrade gracefully outside a repo) ---

function runGit(root: string, args: string): string {
  try {
    return execSync(`git ${args}`, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim()
  } catch {
    return ""
  }
}

export function gitLastCommit(root: string): string {
  return runGit(root, "log -1 --format=%H")
}

export function gitIsRepo(root: string): boolean {
  return runGit(root, "rev-parse --is-inside-work-tree") === "true"
}

export function gitShortStat(root: string): string {
  const stat = runGit(root, "diff --shortstat")
  const porcelain = runGit(root, "status --porcelain")
  const files = porcelain ? porcelain.split("\n").filter(Boolean).length : 0
  return stat ? `${stat} (${files} files uncommitted)` : `${files} files uncommitted`
}

export function gitCommit(root: string, message: string, files: string[]): string {
  try {
    execSync(`git add ${files.map((f) => JSON.stringify(f)).join(" ")}`, { cwd: root, stdio: "ignore" })
    execSync(`git commit -m ${JSON.stringify(message)}`, { cwd: root, stdio: "ignore" })
    return gitLastCommit(root)
  } catch (e) {
    return `commit skipped: ${e instanceof Error ? e.message : String(e)}`
  }
}

export function listSpecs(root: string): string[] {
  const dir = join(root, "specs")
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md") && statSync(join(dir, f)).isFile())
    .map((f) => f.replace(/\.md$/, ""))
}
