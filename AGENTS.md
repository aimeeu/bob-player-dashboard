# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Commands

| Purpose | Command |
|---|---|
| Local dev (hot reload) | `yarn start:dev` |
| Production build + serve | `yarn build` then `yarn start` |
| Run all tests (non-interactive) | `CI=true yarn test` |
| Run a single test file | `CI=true yarn test -- --testPathPattern=App` |
| Run a single test by name | `CI=true yarn test -- --testNamePattern="renders the page"` |
| Re-fetch player data | `node scripts/fetchPlayers.mjs` |

## Architecture

```
src/index.js                              → entry; QueryClientProvider wraps <App>
src/App.jsx                               → Carbon Header + two-page state machine ('browser' | 'formation')
src/components/PlayerSelect/PlayerSelect.tsx  → exports Player interface (canonical type source)
src/components/PlayerCard/PlayerCard.tsx  → Carbon Tile; imports Player from PlayerSelect
src/components/PlayerSummary/PlayerSummary.tsx → dataset-only grounded summary; no network calls
src/components/FormationBoard/FormationBoard.tsx → SVG pitch; all dimensions derived from FIFA 105×68m
src/utils/teamGenerator.ts               → generateRandomTeam(); imports Player from PlayerSelect
src/data/players.json                    → 53 PL players; regenerate with fetchPlayers.mjs
server/server.js                         → Express static host of build/ + GET /health
```

## Critical Non-Obvious Patterns

- **`Player` interface lives only in `PlayerSelect.tsx`** — all other files import it from there. Do not redeclare it.
- **TypeScript annotations must not appear in `.jsx` files** — CRA's Babel does not strip TS type declarations from `.jsx`. Use `.tsx` for typed components. The `type Page = ...` mistake caused a `ReferenceError` at runtime.
- **Importing `.tsx` from `.jsx` requires the explicit `.tsx` extension** — `import Foo from './Foo.tsx'` not `'./Foo'`. CRA's Webpack does not auto-resolve `.tsx` from a `.jsx` importer without a `tsconfig.json`.
- **TypeScript ceiling is v5** — `react-scripts@5` bundles `@typescript-eslint/parser@5.30.5` which breaks on TypeScript 6's compiler API changes. Currently pinned to `^5.8.3`.
- **`yarn start` requires a prior `yarn build`** — it runs Express against `build/`; crashes if the directory doesn't exist.
- **`react`, `react-dom`, Carbon, and all UI packages are in `devDependencies`** — Docker prod stage runs `yarn install --production` and only pulls `express` + `dotenv`. This is intentional.
- **`window.matchMedia` must be mocked in every test** — Carbon components call it and jsdom doesn't provide it. The mock lives in `beforeEach` in `src/App.test.js`; copy it.
- **Navigation is a state machine, not a router** — `currentPage` state in `App.jsx` drives page display. There is no `react-router-dom`. `HeaderMenuItem` `onClick` calls `e.preventDefault()` to suppress the `href="#"` jump.
- **`FormationBoard` uses `overflow: visible`** — goal rectangles protrude outside the field boundary. The outer wrapper adds `padding: 14px 0` to absorb the overflow without clipping.
- **Player photos are externally hosted** — `https://media.api-sports.io/football/players/*.png`. They will be broken if API-Football revokes access.
- **`scripts/fetchPlayers.mjs` uses `.mjs` extension** — required because `package.json` has no `"type": "module"` (adding it would break CRA's Jest transform). Run with `node scripts/fetchPlayers.mjs`.
- **`src/hooks/` directory is empty** — `useWikipediaSummary.ts` was deleted. The directory can be removed or reused.
