export type ConfidenceScore = 1 | 2 | 3 | 4 | 5

export interface HandoffEntry {
  source: string
  captured_at: string
  raw: string
}

export interface RepoState {
  name: string
  path: string
  role: string
  active_phase: string
  volatile_state: string
  confidence_score: ConfidenceScore
  debt_tag: string[]
  next_session_starter: string
  handoffs: HandoffEntry[]
  last_updated: string
}

export interface RelayState {
  schema_version: string
  project_context: string
  active_baton: string
  repos: Record<string, RepoState>
  state_snapshot: {
    last_session: string
    open_threads: string[]
    blockers: string[]
  }
  spec_sync: {
    last_sync: string
    drift: string[]
    specs: Record<string, string>
  }
  updated_at: string
}

export type HandoverKind = "backend" | "frontend" | "infra"

export interface ConsistencyReport {
  ok: boolean
  issues: string[]
}
