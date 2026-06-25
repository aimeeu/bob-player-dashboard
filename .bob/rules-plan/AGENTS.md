# Project Architecture Rules (Non-Obvious Only)

## Page model
- The app has **no router**. `App.jsx` owns a `currentPage` string state (`'browser'` | `'formation'`). The two pages are conditionally rendered — only one is in the DOM at a time. Adding a third page means adding a state value and a conditional render block; do not introduce `react-router-dom`.

## Type ownership
- `Player` interface is declared in `src/components/PlayerSelect/PlayerSelect.tsx` and imported everywhere else. It is the single source of truth for the player data shape. Any field additions require updating both this interface and `scripts/fetchPlayers.mjs`.

## Data flow
- `src/data/players.json` → imported statically in `App.jsx` → passed as props to child components. `@tanstack/react-query` is present in `src/index.js` but currently unused by any component. Do not remove it; it exists for future API calls.

## FormationBoard constraints
- The SVG `overflow: visible` on the field div is load-bearing — goal rectangles render outside the `FIELD_H` boundary. The outer wrapper's `padding: 14px 0` compensates. Removing either breaks the goal display.
- All pitch markings are proportional constants derived from real FIFA dimensions at the top of the file. Do not hardcode pixel values for new markings — compute them from `IW`/`IH`.

## Build pipeline
- Docker multi-stage: stage 1 builds React app; stage 2 copies only `build/`, `server/`, `package.json`, `yarn.lock` and runs `yarn install --production`. **Only `dependencies` (currently `express` and `dotenv`) are available at runtime.** Moving a package from `devDependencies` to `dependencies` is required for any runtime server-side use.

## Styling
- No CSS Modules. All class names are global BEM. `App.scss` holds page-level layout classes only; component SCSS is imported inside each component's `.tsx` file.
- `padding-top: 3rem` on `.app__main` is what clears the fixed Carbon `Header` (48px tall). If the header height changes, this value must change too.
