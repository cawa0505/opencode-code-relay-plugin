---
description: Save current repo state into relay.json and render RESUME.md
argument-hint: [optional note about what changed]
---
Use the `relaySave` tool to capture the current repo's state. Summarize what the user said into `volatile_state`, set `active_phase` if known, and a `confidence` (1-5). If they said what to do next, set `next_session_starter`.
