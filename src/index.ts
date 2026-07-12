import type { Plugin, PluginInput, Hooks } from "@opencode-ai/plugin"
import { tool } from "@opencode-ai/plugin"
import { initRelay } from "./commands/init.js"
import { saveRelay } from "./commands/save.js"
import { closeRelay } from "./commands/close.js"
import { switchRelay, resumeRelay } from "./commands/switch.js"
import { statusRelay } from "./commands/status.js"
import { discoverRoot, readRelay } from "./state.js"
import { renderResume } from "./render.js"

const z = tool.schema

const plugin: Plugin = async (ctx: PluginInput): Promise<Hooks> => {
  const dir = ctx.directory
  return {
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
