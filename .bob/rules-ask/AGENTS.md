# Project Documentation Context (Non-Obvious Only)

- **No router** — navigation is a `useState` state machine in `App.jsx`. There is no `react-router-dom` in use anywhere.
- **`src/hooks/` is empty** — `useWikipediaSummary.ts` was deleted when the Wikipedia feature was replaced by a dataset-only summary. The directory is a leftover.
- **`PlayerSummary` makes zero network calls** — despite looking like a data component, it generates text purely from the local `players.json` data. There is no async state.
- **`FormationBoard` field geometry is all-inline, no CSS** — every pixel value is derived from FIFA 105×68m proportions scaled to 520×800px. The constants are at the top of the file with comments showing the real-world measurements.
- **`chart/` at repo root is a Helm chart** for Kubernetes deployment — unrelated to the React source.
- **Player names are abbreviated** (e.g. `"M. Akanji"`, `"J. Stones"`) — this is how the API-Football API returns them. The full name is not stored.
- **`src/data/players.json` is committed** — it contains 53 Premier League players from the 2023 season fetched from six clubs. It is static until `node scripts/fetchPlayers.mjs` is re-run.
- **Carbon v11 (`@carbon/react` ≥ 1.x)** — CSS class prefix is `cds--`, not the v10 `bx--`.
