import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import type { PluginInput } from "@opencode-ai/plugin";

const PACKAGE_NAME = "@jimmyyen/opencode-code-relay-plugin";
const REGISTRY = "https://registry.npmjs.org";
const CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1h dedup window across instances
const INIT_DELAY_MS = 5000;
const STAMP = "last-update-check.json";

function here(): string {
  return dirname(fileURLToPath(import.meta.url)); // .../dist
}

function getCurrentVersion(): string | null {
  try {
    const pkg = join(here(), "..", "package.json");
    if (existsSync(pkg)) return JSON.parse(readFileSync(pkg, "utf-8")).version ?? null;
  } catch {}
  return null;
}

// install root = the dir that contains node_modules/ holding our package
function getInstallRoot(): string | null {
  let dir = here();
  for (let i = 0; i < 12; i++) {
    const parent = dirname(dir);
    if (parent === dir) break;
    if (existsSync(join(parent, "node_modules", PACKAGE_NAME, "package.json"))) return parent;
    dir = parent;
  }
  return null;
}

async function getLatestVersion(signal: AbortSignal): Promise<string | null> {
  try {
    const res = await fetch(`${REGISTRY}/${PACKAGE_NAME.replace("/", "%2f")}/latest`, { signal });
    if (!res.ok) return null;
    const data = (await res.json()) as { version?: string };
    return data.version ?? null;
  } catch {
    return null;
  }
}

// cross-instance dedup: first to claim the slot writes an atomic timestamp
function claimSlot(root: string | null): boolean {
  if (!root) return true;
  try {
    const file = join(root, STAMP);
    if (existsSync(file)) {
      try {
        const raw = JSON.parse(readFileSync(file, "utf-8")) as { lastCheckedMs?: unknown };
        const last = typeof raw.lastCheckedMs === "number" ? raw.lastCheckedMs : 0;
        if (Number.isFinite(last) && Date.now() - last < CHECK_INTERVAL_MS) return false;
      } catch {}
    }
    mkdirSync(dirname(file), { recursive: true });
    const tmp = `${file}.tmp.${process.pid}`;
    writeFileSync(tmp, JSON.stringify({ lastCheckedMs: Date.now() }), "utf-8");
    renameSync(tmp, file);
    return true;
  } catch {
    return true;
  }
}

function installLatest(root: string, signal: AbortSignal): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn(
      "npm",
      ["install", `${PACKAGE_NAME}@latest`, "--no-save", "--ignore-scripts"],
      { cwd: root, stdio: "ignore", signal },
    );
    child.on("exit", (code) => resolve(code === 0));
    child.on("error", () => resolve(false));
  });
}

type ToastBody = {
  title?: string;
  message: string;
  variant: "info" | "success" | "warning" | "error";
  duration?: number;
};
// SDK exposes showToast on `client.tui` (magic-context uses it); our client type
// does not surface it, so probe at runtime and no-op if absent.
function toast(
  ctx: PluginInput,
  title: string,
  message: string,
  variant: "info" | "success" | "warning" | "error",
): void {
  try {
    const tui = (ctx.client as { tui?: { showToast?: (o: { body: ToastBody }) => unknown } }).tui;
    tui?.showToast?.({ body: { title, message, variant, duration: 8000 } });
  } catch {}
}

export function startAutoUpdate(ctx: PluginInput): void {
  if (process.env.CODE_RELAY_AUTOUPDATE === "0") return; // opt-out for dev
  const timer = setTimeout(() => {
    void (async () => {
      const root = getInstallRoot();
      if (!claimSlot(root)) return;
      const current = getCurrentVersion();
      if (!current) return;
      const signal = new AbortController().signal;
      const latest = await getLatestVersion(signal);
      if (!latest || latest === current) return;
      toast(
        ctx,
        "Code Relay Updated",
        `v${current} → v${latest}. Restart OpenCode to apply.`,
        "success",
      );
      if (root) await installLatest(root, signal);
    })().catch(() => {});
  }, INIT_DELAY_MS);
  if (typeof timer.unref === "function") timer.unref();
}
