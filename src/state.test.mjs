// Self-check for discoverRoot boundary rules. No framework: `node src/state.test.mjs`.
import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { homedir, tmpdir } from "node:os"
import { join } from "node:path"
import { discoverRoot } from "./state.ts"

const root = mkdtempSync(join(tmpdir(), "relay-root-test-"))
const relay = (d) => writeFileSync(join(d, "relay.json"), "{}")
const git = (d) => mkdirSync(join(d, ".git"), { recursive: true })
const mk = (d) => mkdirSync(d, { recursive: true })
let n = 0
const test = (name, fn) => {
  try {
    fn()
    console.log(`ok ${++n} - ${name}`)
  } catch (e) {
    console.error(`not ok - ${name}\n  ${e.message}`)
    process.exitCode = 1
  }
}

try {
  // nearest match wins
  const outer = join(root, "outer")
  mk(join(outer, "inner"))
  relay(outer)
  git(outer)
  relay(join(outer, "inner"))
  git(join(outer, "inner"))
  test("nearest match wins", () => {
    assert.equal(discoverRoot(join(outer, "inner")), join(outer, "inner"))
  })

  // git boundary: repo without its own relay must not adopt an ancestor's
  const stray = join(root, "stray")
  mk(join(stray, "repoB/sub"))
  relay(stray)
  git(join(stray, "repoB"))
  test("does not cross .git boundary", () => {
    assert.equal(discoverRoot(join(stray, "repoB/sub")), null)
  })

  // subdir of a repo that HAS its own relay still resolves
  const repoA = join(root, "repoA")
  mk(join(repoA, "src/deep"))
  git(repoA)
  relay(repoA)
  test("finds own repo relay from subdir", () => {
    assert.equal(discoverRoot(join(repoA, "src/deep")), repoA)
  })

  // home boundary (home here has no relay.json, so walk must stop and yield null)
  test("does not cross $HOME", () => {
    assert.equal(discoverRoot(homedir()), null)
  })

  // no relay anywhere under a bare temp dir -> null, no throw
  const bare = join(root, "bare")
  mk(join(bare, "a/b"))
  test("returns null when no root found", () => {
    assert.equal(discoverRoot(join(bare, "a/b")), null)
  })

  // symlinked start resolves against the real location
  const real = join(root, "real")
  mk(join(real, "sub"))
  relay(real)
  git(real)
  const link = join(root, "link")
  symlinkSync(real, link, "dir")
  test("symlinked start path", () => {
    assert.equal(discoverRoot(join(link, "sub")), real)
  })
} finally {
  rmSync(root, { recursive: true, force: true })
}

console.log(process.exitCode ? "\nFAILED" : "\nall checks passed")
