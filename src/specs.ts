import { createHash } from "node:crypto"
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import { readRelay, writeRelay, now } from "./state.js"
import type { ConsistencyReport } from "./types.js"

function hash(content: string): string {
  return createHash("sha1").update(content).digest("hex").slice(0, 12)
}

function specPath(root: string, name: string): string {
  return join(root, "specs", `${name}.md`)
}

export interface SpecDiff {
  spec: string
  status: "added" | "modified" | "unchanged"
}

/** Compare current specs/ against the last sync snapshot, persist new hashes. */
export function diffSpecs(root: string): SpecDiff[] {
  const dir = join(root, "specs")
  if (!existsSync(dir)) return []
  const files = readdirSync(dir).filter((f) => f.endsWith(".md") && statSync(join(dir, f)).isFile())
  const relay = readRelay(root)
  const prev = relay.spec_sync.specs
  const next: Record<string, string> = {}
  const diffs: SpecDiff[] = []

  for (const f of files) {
    const name = f.replace(/\.md$/, "")
    const content = readFileSync(join(dir, f), "utf8")
    const h = hash(content)
    next[name] = h
    if (!prev[name]) diffs.push({ spec: name, status: "added" })
    else if (prev[name] !== h) diffs.push({ spec: name, status: "modified" })
    else diffs.push({ spec: name, status: "unchanged" })
  }

  relay.spec_sync.specs = next
  relay.spec_sync.last_sync = now()
  const drift = diffs.filter((d) => d.status !== "unchanged").map((d) => `${d.spec} (${d.status})`)
  if (drift.length) relay.spec_sync.drift = drift
  writeRelay(root, relay)
  return diffs
}

/** Naive intent extraction: first meaningful heading or line. */
export function extractIntent(content: string): string {
  const lines = content.split("\n").map((l) => l.trim()).filter(Boolean)
  const heading = lines.find((l) => /^#{1,3}\s/.test(l))
  const text = (heading ?? lines[0] ?? "").replace(/^#{1,3}\s*/, "").trim()
  return text.length > 120 ? text.slice(0, 117) + "..." : text
}

/** Lightweight spec-vs-spec consistency scan. */
export function consistencyCheck(root: string): ConsistencyReport {
  const dir = join(root, "specs")
  const issues: string[] = []
  if (!existsSync(dir)) return { ok: true, issues }

  const files = readdirSync(dir).filter((f) => f.endsWith(".md") && statSync(join(dir, f)).isFile())
  for (const f of files) {
    const name = f.replace(/\.md$/, "")
    const content = readFileSync(join(dir, f), "utf8")
    if (!/^#\s/m.test(content)) issues.push(`${name}: missing top-level title`)
    if (/CONFLICT:/i.test(content)) issues.push(`${name}: contains CONFLICT marker`)
    if (/BROKEN:/i.test(content)) issues.push(`${name}: contains BROKEN marker`)
    const removed = content.split("\n").filter((l) => /^##\s+REMOVED Requirements/i.test(l))
    if (removed.length) {
      const after = content.slice(content.indexOf(removed[0]) + removed[0].length)
      if (after.trim().length > 0) issues.push(`${name}: has REMOVED requirements (reconcile drift)`)
    }
  }
  return { ok: issues.length === 0, issues }
}
