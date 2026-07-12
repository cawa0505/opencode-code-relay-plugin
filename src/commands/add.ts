import { basename, resolve } from "node:path"
import { existsSync, readFileSync } from "node:fs"
import { discoverRoot, addHandoff } from "../state.js"

export interface AddArgs {
  file: string
  repo?: string
}

export function addHandoffCmd(startDir: string, args: AddArgs): string {
  const root = discoverRoot(startDir)
  if (!root) return "No relay.json found. Run relayInit first."

  const repo = args.repo ?? basename(startDir)
  const file = resolve(startDir, args.file)
  if (!existsSync(file)) return `File not found: ${args.file}`

  const raw = readFileSync(file, "utf8")
  const relay = addHandoff(root, repo, basename(file), raw)
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean).length
  return (
    `Added handoff "${basename(file)}" to "${repo}".\n` +
    `Parsed ${lines} line(s) into open_threads.\n` +
    `Total open threads: ${relay.state_snapshot.open_threads.length}`
  )
}
