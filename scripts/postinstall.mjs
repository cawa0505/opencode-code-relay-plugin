// Copies this plugin's slash commands into opencode's global commands dir.
// opencode does NOT auto-discover commands from npm plugin packages, but it
// DOES discover them from ~/.config/opencode/commands/. This postinstall makes
// /relay-* appear automatically after `opencode plugin add`.
import { cpSync, mkdirSync, existsSync } from "node:fs"
import { homedir } from "node:os"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), "..")
const src = join(pkgRoot, "commands")
const dest = join(homedir(), ".config", "opencode", "commands")

try {
  if (!existsSync(src)) {
    console.log("[code-relay] no commands/ to install, skipping")
    process.exit(0)
  }
  mkdirSync(dest, { recursive: true })
  cpSync(src, dest, { recursive: true })
  console.log(`[code-relay] slash commands installed to ${dest}`)
} catch (err) {
  // Never break `opencode plugin add` if the copy fails (e.g. no write access).
  console.warn(`[code-relay] could not install slash commands: ${err?.message ?? err}`)
}
