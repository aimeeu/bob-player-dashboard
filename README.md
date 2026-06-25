# Player Dashboard — Carbon React UI

<p align="left">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" alt="React 18">
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript 5">
  <img src="https://img.shields.io/badge/Carbon%20Design%20System-v11-0043CE?logo=ibm&logoColor=white" alt="Carbon v11">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white" alt="Node 18+">
  <img src="https://img.shields.io/badge/license-Apache%202.0-blue" alt="Apache 2">
</p>

A Premier League player dashboard built on React 18, the IBM Carbon Design System, and an Express production server. The application provides two views — a **Player Browser** for querying individual player statistics and a **Team Formation Visualizer** displaying a FIFA-proportioned SVG pitch with 11 randomly selected players.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
  - [Component Class Diagram](#component-class-diagram)
  - [Data Flow Sequence — Player Browser](#data-flow-sequence--player-browser)
  - [Data Flow Sequence — Team Formation](#data-flow-sequence--team-formation)
  - [Build and Deployment Pipeline](#build-and-deployment-pipeline)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Data Ingestion Script](#data-ingestion-script)
- [Testing](#testing)
- [Production Deployment](#production-deployment)
  - [Docker](#docker)
  - [Kubernetes / OpenShift (Helm)](#kubernetes--openshift-helm)
- [Design Decisions and Gotchas](#design-decisions-and-gotchas)
- [License](#license)

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| UI framework | React | 18.2 |
| Language | TypeScript (components), JavaScript (App entry) | 5.x |
| Design system | IBM Carbon `@carbon/react` | 1.8 (v11) |
| Build tool | Create React App (`react-scripts`) | 5.0.1 |
| Styling | Sass (Dart Sass, `@use` module system) | 1.x |
| Server-side state | TanStack Query | 4.x |
| Production server | Express | 4.18 |
| Package manager | Yarn | 1.22 |
| Test runner | Jest + React Testing Library | CRA defaults |
| Container base | Red Hat UBI8 Node.js 16 | — |
| Orchestration | Helm chart (`chart/base/`) | 1.0.0 |

---

## Project Structure

```
.
├── chart/base/                  # Helm chart for Kubernetes/OpenShift deployment
│   └── templates/               # Deployment, Service, Ingress, Route manifests
├── public/                      # CRA static assets (tab-illo.png, etc.)
├── scripts/
│   └── fetchPlayers.mjs         # One-off data ingestion script (ESM, requires .env)
├── server/
│   └── server.js                # Express production server — serves build/ + /health
├── src/
│   ├── App.jsx                  # Root component; Carbon Header + page state machine
│   ├── App.scss                 # Page-level BEM layout classes
│   ├── App.test.js              # Integration tests (RTL + userEvent)
│   ├── index.js                 # React entry; mounts QueryClientProvider
│   ├── index.scss               # Global Carbon styles (@use '@carbon/react')
│   ├── components/
│   │   ├── FormationBoard/
│   │   │   └── FormationBoard.tsx   # FIFA-proportioned SVG pitch (520×800 px)
│   │   ├── PlayerCard/
│   │   │   ├── PlayerCard.tsx       # Carbon Tile with player stats
│   │   │   └── _player-card.scss
│   │   ├── PlayerSelect/
│   │   │   └── PlayerSelect.tsx     # Dropdown + canonical Player interface export
│   │   └── PlayerSummary/
│   │       ├── PlayerSummary.tsx    # Dataset-only grounded text summary
│   │       └── _player-summary.scss
│   ├── data/
│   │   └── players.json         # 53 PL players (2023 season); committed static asset
│   └── utils/
│       └── teamGenerator.ts     # generateRandomTeam() — Fisher-Yates shuffle
├── .env                         # API_FOOTBALL_KEY (not committed)
├── Dockerfile                   # Multi-stage build (builder → minimal runtime)
└── package.json
```

---

## Architecture

### Component Class Diagram

```mermaid
classDiagram
    direction TB

    class Player {
        +string name
        +string photo
        +string position
        +number age
        +string citizenship
        +number|null height
        +string club
        +number form
    }

    class App {
        -string currentPage
        -string selectedName
        -Player[] teamPlayers
        +navigate(e, page) void
        +handleGenerateTeam() void
    }

    class PlayerSelect {
        +Player[] players
        +string selectedName
        +onChange(name) void
        -sort() Player[]
    }

    class PlayerCard {
        +Player player
        -fmt(val) string
    }

    class PlayerSummary {
        +Player player
        -buildSummary(player) string
        -formLabel(rating) string
    }

    class FormationBoard {
        +Player[] players
        -SLOTS SlotPos[]
        -FieldMarkings()
        -EndMarkings(topY, dir)
        -PlayerToken(player, slot, x, y)
        -arcPath(cx, cy, r, start, end) string
    }

    class teamGenerator {
        +generateRandomTeam(Player[]) Player[]
        -shuffle~T~(T[]) T[]
    }

    App --> PlayerSelect : props
    App --> PlayerCard : props (conditional)
    App --> PlayerSummary : props (conditional)
    App --> FormationBoard : props
    App ..> teamGenerator : uses
    PlayerSelect ..> Player : exports
    PlayerCard ..> Player : imports
    PlayerSummary ..> Player : imports
    FormationBoard ..> Player : imports
    teamGenerator ..> Player : imports
```

### Data Flow Sequence — Player Browser

```mermaid
sequenceDiagram
    actor User
    participant App
    participant PlayerSelect
    participant PlayerCard
    participant PlayerSummary
    participant players.json

    App->>players.json: import (static, at bundle time)
    players.json-->>App: Player[]

    User->>PlayerSelect: selects player from dropdown
    PlayerSelect->>App: onChange(name)
    App->>App: setSelectedName(name)
    App->>App: find player in playersData

    App->>PlayerCard: player prop
    PlayerCard-->>User: renders photo, stats (Carbon Tile)

    App->>PlayerSummary: player prop
    PlayerSummary->>PlayerSummary: buildSummary(player)
    Note right of PlayerSummary: Pure function — no network call
    PlayerSummary-->>User: renders grounded text summary
```

### Data Flow Sequence — Team Formation

```mermaid
sequenceDiagram
    actor User
    participant App
    participant teamGenerator
    participant FormationBoard

    User->>App: clicks "Generate Random Team"
    App->>teamGenerator: generateRandomTeam(playersData)
    teamGenerator->>teamGenerator: Fisher-Yates shuffle
    teamGenerator-->>App: Player[] (11 players)
    App->>App: setTeamPlayers(result)

    App->>FormationBoard: players prop
    FormationBoard->>FormationBoard: render SVG pitch (520×800 px)
    Note right of FormationBoard: All dimensions derived from FIFA 105×68m
    FormationBoard->>FormationBoard: place PlayerToken at SLOT[i] coordinates
    FormationBoard-->>User: renders pitch with 11 player tokens
```

### Build and Deployment Pipeline

```mermaid
flowchart TD
    subgraph dev["Local Development"]
        D1[yarn install] --> D2[yarn start:dev]
        D2 --> D3[CRA dev server :3000\nhot reload]
    end

    subgraph script["Data Ingestion"]
        S1[.env\nAPI_FOOTBALL_KEY] --> S2[node scripts/fetchPlayers.mjs]
        S2 --> S3[API-Football\nhttps://v3.football.api-sports.io]
        S3 --> S4[src/data/players.json\n53 players committed]
    end

    subgraph docker["Docker Multi-Stage Build"]
        B1["Stage 1: ubi8/nodejs-16\nyarn install\nyarn build"] --> B2["build/ static assets"]
        B2 --> B3["Stage 2: ubi8/nodejs-16-minimal\ncopy build/ + server/ + package.json\nyarn install --production"]
        B3 --> B4["Image: express + dotenv only\nCMD npm start :3000"]
    end

    subgraph k8s["Kubernetes / OpenShift"]
        K1[helm install\nchart/base] --> K2[Deployment\nreplicaCount: 1]
        K2 --> K3[Service\nClusterIP :80 → :3000]
        K3 --> K4[Ingress\nIBM Cloud subdomain]
    end

    subgraph runtime["Production Runtime"]
        R1["GET /health → {status:'UP'}"]
        R2["GET /* → build/index.html"]
        R3["Static: build/static/**"]
    end

    docker --> k8s
    k8s --> runtime
```

---

## Getting Started

**Prerequisites:** Node.js 18+, Yarn 1.x

```bash
# Install dependencies
yarn install

# Start development server (hot reload on :3000)
yarn start:dev
```

---

## Environment Variables

Create a `.env` file in the project root (already in `.gitignore`):

```dotenv
# Required only to re-run the data ingestion script
API_FOOTBALL_KEY=your_api_key_here
```

The application reads `players.json` from the committed static file at build time — the API key is **not** needed to run the app. It is only needed to re-fetch player data.

---

## Data Ingestion Script

`scripts/fetchPlayers.mjs` fetches Premier League player data from [API-Football](https://www.api-football.com/) and writes `src/data/players.json`.

```bash
node scripts/fetchPlayers.mjs
```

**Design decisions:**
- Queries by **team ID** (not league ID) with **season 2023** — the only combination that returns players with complete `games.rating` values on the free plan.
- Applies a 600 ms delay between API requests to stay within the free-plan rate limit.
- Filters to players with Premier League (`league.id === 39`) statistics only, deduplicates by name, and stores 53 players.
- Uses the `.mjs` extension because `package.json` has no `"type": "module"` (required to avoid breaking CRA's Jest CommonJS transform).

---

## Testing

```bash
# Run all tests (non-interactive)
CI=true yarn test

# Run tests matching a file name pattern
CI=true yarn test -- --testPathPattern=App

# Run a single test by name
CI=true yarn test -- --testNamePattern="switches to the formation page"
```

Tests live alongside source files. Carbon components require a `window.matchMedia` mock in `beforeEach` — the canonical mock is in [`src/App.test.js`](src/App.test.js).

---

## Production Deployment

### Docker

```bash
# Build image
docker build -t player-dashboard:latest .

# Run
docker run -p 3000:3000 player-dashboard:latest
```

The multi-stage Dockerfile:
1. **Builder stage** (`ubi8/nodejs-16`) — installs all dependencies and runs `yarn build`
2. **Runtime stage** (`ubi8/nodejs-16-minimal`) — copies only `build/`, `server/`, and runs `yarn install --production`

The runtime image contains only `express` and `dotenv`. All React, Carbon, and TypeScript packages are build-time only.

The Express server exposes:

| Endpoint | Description |
|---|---|
| `GET /health` | Returns `{"status":"UP"}` — used as liveness/readiness probe |
| `GET /static/**` | Serves CRA-built static assets from `build/` |
| `GET /*` | Returns `build/index.html` (SPA catch-all) |

The server port defaults to `3000` and is overridden with the `PORT` environment variable.

### Kubernetes / OpenShift (Helm)

The Helm chart in `chart/base/` targets IBM Cloud Kubernetes Service and OpenShift.

```bash
helm install player-dashboard ./chart/base \
  --set image.repository=<registry>/<image> \
  --set image.tag=<tag> \
  --set vcsInfo.repoUrl=<repo-url> \
  --set vcsInfo.branch=main
```

Key `values.yaml` defaults:

| Value | Default | Description |
|---|---|---|
| `replicaCount` | `1` | Pod replicas |
| `image.port` | `3000` | Container port |
| `service.type` | `ClusterIP` | Kubernetes service type |
| `service.port` | `80` | Service port (maps to `3000`) |
| `ingress.enabled` | `true` | Creates an Ingress resource |
| `ingress.subdomain` | `containers.appdomain.cloud` | IBM Cloud default subdomain |
| `route.enabled` | `false` | OpenShift Route (enable for OCP) |

For OpenShift pipelines using the IBM Garage Cloud-Native Toolkit:

```bash
npm install -g @ibmgaragecloud/cloud-native-toolkit-cli
oc sync <project> --tekton
oc pipeline
```

---

## Design Decisions and Gotchas

| Decision | Rationale |
|---|---|
| **No client-side router** | Navigation is a `currentPage` state machine in `App.jsx`. Only one page is in the DOM at a time. `HeaderMenuItem` uses `e.preventDefault()` to suppress the `href="#"` jump. |
| **`Player` interface in `PlayerSelect.tsx`** | Single canonical source; all other files import from there. Prevents drift between the API shape and component props. |
| **TypeScript components use `.tsx`; `App.jsx` stays `.js`** | CRA's Babel does not strip TypeScript type syntax from `.jsx` files — it emits it verbatim, causing `ReferenceError` at runtime. Typed code lives in `.tsx` files only. |
| **Explicit `.tsx` extension in imports from `.jsx`** | Without a `tsconfig.json`, CRA's Webpack resolver does not auto-resolve `.tsx` from a `.jsx` importer. |
| **TypeScript pinned to `^5.x`** | `react-scripts@5` bundles `@typescript-eslint/parser@5.30.5`, which breaks on the TypeScript 6 compiler API. |
| **`FormationBoard` uses `overflow: visible`** | Goal rectangles protrude 14 px outside `FIELD_H`. The outer wrapper adds `padding: 14px 0` to absorb overflow without clipping page layout. |
| **All pitch dimensions derived from FIFA 105×68m** | Constants at the top of `FormationBoard.tsx` compute every measurement proportionally from `IW`/`IH`. Do not hardcode pixel values for new markings. |
| **`players.json` committed to source** | The free API-Football plan has strict rate limits. Committing the static file means the app works without an API key. Re-run `fetchPlayers.mjs` to refresh data. |
| **`react` and Carbon in `devDependencies`** | The Docker runtime stage runs `yarn install --production` and only installs `express` + `dotenv`. React and Carbon are bundled into `build/` by CRA and not needed at runtime. |

---

## License

Licensed under the [Apache License, Version 2.0](https://www.apache.org/licenses/LICENSE-2.0.txt).

Third-party code is subject to its own respective licenses. Contributions are subject to the [Developer Certificate of Origin, Version 1.1](https://developercertificate.org/).
