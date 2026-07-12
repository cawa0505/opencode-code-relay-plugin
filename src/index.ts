import type { Plugin, PluginInput, Hooks, Config } from "@opencode-ai/plugin"
import { tool } from "@opencode-ai/plugin"
import { initRelay } from "./commands/init.js"
import { saveRelay } from "./commands/save.js"
import { closeRelay } from "./commands/close.js"
import { switchRelay, resumeRelay } from "./commands/switch.js"
import { statusRelay } from "./commands/status.js"
import { discoverRoot, readRelay } from "./state.js"
import { renderResume } from "./render.js"
import { startAutoUpdate } from "./auto-update.js"

const z = tool.schema

const plugin: Plugin = async (ctx: PluginInput): Promise<Hooks> => {
  startAutoUpdate(ctx) // best-effort: check npm for a newer version in the background
  const dir = ctx.directory
  // opencode does NOT auto-discover slash commands from npm plugin packages.
  // Register them here by mutating cfg.command (same pattern the plugin
  // ecosystem uses). The .md files in commands/ are kept only as reference.
  const commands: Record<string, { description: string; template: string }> = {
    "relay-init": {
      description: "Initialize a relay.json to start cross-session state handoff",
      template:
        "Use the `relayInit` tool to create a `relay.json` in the current directory, plus `specs/` and `.code-relay/` folders. If the user described the project, pass it as `project_context`.",
    },
    "relay-save": {
      description: "Save current repo state into relay.json and render RESUME.md",
      template:
        "Use the `relaySave` tool to capture the current repo's state. Summarize what the user said into `volatile_state`, set `active_phase` if known, and a `confidence` (1-5). If they said what to do next, set `next_session_starter`.",
    },
    "relay-close": {
      description: "Run the closing ritual (consistency check, spec diff, next_step.md, commit)",
      template:
        "Use the `relayClose` tool to run the closing ritual for the current repo. If the user gave a next-step instruction, pass it as `next_session_starter`.",
    },
    "relay-switch": {
      description: "Pass the baton to another repo and render its handover",
      template:
        "Use the `relaySwitch` tool with the target repo name (from `relayStatus`) as `repo`.",
    },
    "relay-resume": {
      description: "Render the RESUME handover for the active repo (bootstrap a new session)",
      template:
        "Use the `relayResume` tool to print the RESUME handover for the active repo. If the user named a repo, pass it as `repo`.",
    },
    "relay-status": {
      description: "Show relay summary (repos, active baton, spec drift)",
      template: "Use the `relayStatus` tool to print the current relay state.",
    },
  }

  return {
    config: async (cfg: Config) => {
      const c = cfg as Record<string, any>
      c.command ??= {}
      for (const [name, def] of Object.entries(commands)) {
        c.command[name] = def
      }
    },
    tool: {
      relayInit: tool({
        description:
          "Initialize a relay.json at the current directory to start cross-session / cross-repo state handoff.",
        args: {
          project_context: z.string().optional(),
          kind: z.enum(["backend", "frontend", "infra"]).optional(),
        },
        execute: async (args) => initRelay(dir, args.project_context ?? ""),
      }),
      relaySave: tool({
        description:
          "Save the current repo's volatile state, phase, confidence and next-step into relay.json and render RESUME.md.",
        args: {
          repo: z.string().optional(),
          role: z.string().optional(),
          active_phase: z.string().optional(),
          volatile_state: z.string().optional(),
          confidence: z.number().optional(),
          next_session_starter: z.string().optional(),
          debt_tag: z.string().optional(),
          kind: z.enum(["backend", "frontend", "infra"]).optional(),
        },
        execute: async (args) => saveRelay(dir, args),
      }),
      relayClose: tool({
        description:
          "Run the closing ritual: consistency check, spec diff, next_step.md, and an atomic commit of relay.json + specs.",
        args: {
          repo: z.string().optional(),
          next_session_starter: z.string().optional(),
        },
        execute: async (args) => closeRelay(dir, args),
      }),
      relaySwitch: tool({
        description: "Pass the baton to another registered repo and render its RESUME handover.",
        args: {
          repo: z.string(),
          kind: z.enum(["backend", "frontend", "infra"]).optional(),
        },
        execute: async (args) => switchRelay(dir, args.repo, args.kind),
      }),
      relayResume: tool({
        description:
          "Render the RESUME handover for the active (or given) repo — used to bootstrap a new session.",
        args: {
          repo: z.string().optional(),
          kind: z.enum(["backend", "frontend", "infra"]).optional(),
        },
        execute: async (args) => resumeRelay(dir, args.repo, args.kind),
      }),
      relayStatus: tool({
        description: "Show relay summary: repos, active baton, spec drift, last update.",
        args: {},
        execute: async () => statusRelay(dir),
      }),
    },
    "experimental.session.compacting": async (_input, output) => {
      const root = discoverRoot(dir)
      if (!root) return
      try {
        const relay = readRelay(root)
        const target = relay.active_baton
        if (!target || !relay.repos[target]) return
        const text = renderResume(root, target, "backend")
        output.context.push(`[Code Relay] Active repo: ${target}\n${text}`)
      } catch {
        // best-effort: never break compaction
      }
    },
  }
}

export default plugin
