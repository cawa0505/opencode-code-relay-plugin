import { basename } from "node:path"
import { discoverRoot, updateRepo, gitCommit, gitIsRepo } from "../state.js"
import { renderNextStep } from "../render.js"
import { consistencyCheck, diffSpecs } from "../specs.js"

export interface CloseArgs {
  repo?: string
  next_session_starter?: string
}

export function closeRelay(startDir: string, args: CloseArgs): string {
  const root = discoverRoot(startDir)
  if (!root) return "No relay.json found. Run relayInit first."

  const repo = args.repo ?? basename(startDir)
  const report = consistencyCheck(root)
  const diffs = diffSpecs(root)
  if (args.next_session_starter) updateRepo(root, repo, { next_session_starter: args.next_session_starter })
  const next = renderNextStep(root, repo)

  const lines = [
    `Closing ritual for "${repo}".`,
    `Consistency: ${report.ok ? "OK" : "ISSUES"}`,
    ...report.issues.map((i) => `  - ${i}`),
    `Spec sync: ${diffs.length ? diffs.map((d) => `${d.spec}:${d.status}`).join(", ") : "no changes"}`,
    "",
    next,
  ]

  let commitInfo = "not a git repo — skipped commit"
  if (gitIsRepo(root)) {
    const hash = gitCommit(root, `relay: close ${repo} [${new Date().toISOString()}]`, ["relay.json", "specs"])
    commitInfo = `committed: ${hash}`
  }
  return [...lines, "", commitInfo].join("\n")
}
