import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { readRelay, gitLastCommit, gitShortStat, gitIsRepo } from "./state.js"

const __dirname = dirname(fileURLToPath(import.meta.url))
import { extractIntent } from "./specs.js"
import type { HandoverKind, RelayState, RepoState } from "./types.js"

const KINDS: HandoverKind[] = ["backend", "frontend", "infra"]

function loadTemplate(kind: HandoverKind, customPath?: string): string {
  const file = customPath ?? join(__dirname, "templates", `${kind}.md`)
  if (!existsSync(file)) return existsSync(join(__dirname, "templates", "backend.md"))
    ? readFileSync(join(__dirname, "templates", "backend.md"), "utf8")
    : "# Resume — {{repo_name}}\n\n{{volatile_state}}\n"
  return readFileSync(file, "utf8")
}

function fill(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k: string) => vars[k] ?? "")
}

function specIntent(root: string, repo: string): string {
  const p = join(root, "specs", `${repo}.md`)
  if (!existsSync(p)) return "(no spec yet)"
  return extractIntent(readFileSync(p, "utf8"))
}

function varsFor(root: string, relay: RelayState, repo: RepoState): Record<string, string> {
  const repoDir = join(root, repo.path)
  const commit = gitIsRepo(repoDir) ? gitLastCommit(repoDir) : ""
  return {
    project_context: relay.project_context || "(unset)",
    repo_name: repo.name,
    role: repo.role || "(unset)",
    active_phase: repo.active_phase || "(unset)",
    volatile_state: repo.volatile_state || "(unset)",
    confidence_score: String(repo.confidence_score),
    debt_tag: repo.debt_tag.length ? repo.debt_tag.map((d) => `- ${d}`).join("\n") : "(none)",
    next_session_starter: repo.next_session_starter || "(none planned)",
    last_updated: repo.last_updated,
    git_commit: commit || "(not a git repo)",
    git_stat: gitIsRepo(repoDir) ? gitShortStat(repoDir) : "n/a",
    spec_intent: specIntent(root, repo.name),
    schema_version: relay.schema_version,
    handoffs: repo.handoffs.length
      ? repo.handoffs
          .map((h) => `### From ${h.source} (${h.captured_at})\n${h.raw.trim()}`)
          .join("\n\n")
      : "(none)",
  }
}

export function renderResume(root: string, repoName: string, kind: HandoverKind = "backend", customPath?: string): string {
  const relay = readRelay(root)
  const repo = relay.repos[repoName]
  if (!repo) throw new Error(`repo "${repoName}" not found in relay.json`)
  const k: HandoverKind = KINDS.includes(kind) ? kind : "backend"
  const out = fill(loadTemplate(k, customPath), varsFor(root, relay, repo))
  writeFileSync(join(root, "RESUME.md"), out + "\n", "utf8")
  return out
}

export function renderNextStep(root: string, repoName: string): string {
  const relay = readRelay(root)
  const repo = relay.repos[repoName]
  if (!repo) throw new Error(`repo "${repoName}" not found in relay.json`)
  const tpl = `# Next session starter — {{repo_name}}

> Run this first in the next session.

{{next_session_starter}}

## Open debts
{{debt_tag}}

## Confidence
{{confidence_score}}/5

---
_Generated {{last_updated}}_
`
  const out = fill(tpl, varsFor(root, relay, repo))
  writeFileSync(join(root, "next_step.md"), out + "\n", "utf8")
  return out
}
