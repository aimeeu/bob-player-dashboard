# Project Coding Rules (Non-Obvious Only)

## File extensions and TypeScript
- Components are `.tsx`; `App.jsx` is the exception. Do **not** add TypeScript type annotations to `.jsx` files — CRA's Babel emits them as-is and causes `ReferenceError` at runtime.
- Importing a `.tsx` file from a `.jsx` file **requires** the explicit `.tsx` extension in the import path. Omitting it causes a `Module not found` build error.
- TypeScript must stay at `^5.x` — v6 breaks the bundled `@typescript-eslint/parser@5.30.5`.

## The `Player` interface
- Declared once in `src/components/PlayerSelect/PlayerSelect.tsx` and re-exported. Every other file imports from there. Never redeclare it.

## Component style
- All components are function components with hooks. `App.jsx` switched away from class components; don't introduce new class components.

## SCSS
- `App.scss` no longer aggregates component SCSS via `@use`. Component SCSS files (`_player-card.scss`, `_player-summary.scss`) are imported directly inside their `.tsx` file with a relative path. Use the same pattern for new components.
- `src/index.scss` still loads all Carbon styles once via `@use '@carbon/react'`. Never re-import Carbon in a component file.

## Carbon icons
- Import from `@carbon/react/icons`, not `@carbon/icons-react`.

## Tests
- Mock `window.matchMedia` in `beforeEach` (not inside each test) — see `src/App.test.js`.
- Navigation tests use `userEvent.click` on `role="link"` elements (Carbon `HeaderMenuItem` renders `<a>`).
- Run non-interactively with `CI=true yarn test` to avoid the watch-mode prompt.

## Data script
- `scripts/fetchPlayers.mjs` must use the `.mjs` extension. Re-run it to refresh `src/data/players.json`.
