# Mobile Plan

## Feasibility

Yes, a React Native mobile app can be created in `mobile/` from the existing repository contents.

What is reusable:

- `packages/core` for KSN, Kardashev, yield, and agency logic.
- `apps/web` concepts and copy as product-direction reference.
- NASA Open APIs for public astronomy content.
- Apify actor `mukedlii/global-electricity-price-monitor` for electricity pricing data.

What is not directly reusable:

- `@dennislee928/nothingx-react-components` is a React / `react-dom` package, so it is web-first and not directly installable as a React Native UI runtime.
- The mobile app must port the NothingX visual language into native components and tokens instead of importing the DOM components.

Implementation approach:

- Use Expo React Native for the `mobile` app.
- Reuse `packages/core` by building it before mobile dev/build/typecheck commands.
- Port the NothingX style into a local native design system with black, white, and red hardware-inspired surfaces.
- Add live data clients for NASA APOD and the Apify electricity monitor.
- Keep a fallback path so the app remains usable when an API key or token is missing.

## Phase 1 - Workspace And Shell

- [ ] Add `mobile` to the pnpm workspace.
- [ ] Create `mobile/package.json` with Expo, React Native, and workspace dependencies.
- [ ] Create `mobile/app.json`, `mobile/babel.config.js`, `mobile/tsconfig.json`, and `mobile/index.js`.
- [ ] Add root scripts for `dev:mobile`, `build:mobile`, and `typecheck:mobile`.
- [ ] Add a local env contract for `EXPO_PUBLIC_NASA_API_KEY` and `EXPO_PUBLIC_APIFY_TOKEN`.

## Phase 2 - Native Design System

- [ ] Create a Nothing-inspired theme with black, white, and red tokens.
- [ ] Create reusable native UI primitives for cards, pills, buttons, stat blocks, and section headers.
- [ ] Add formatting helpers for watts, currency, percentages, and KSN values.
- [ ] Add a minimal loading and error presentation that works on mobile.

## Phase 3 - Data Integrations

- [ ] Add a NASA APOD client that supports the current day plus optional date overrides.
- [ ] Add an Apify electricity monitor client that normalizes actor output into a stable shape.
- [ ] Add fallbacks so the app still renders when APIs are offline or credentials are absent.
- [ ] Reuse `packages/core` to compute asset snapshots, yield splits, and autonomy risk summaries.

## Phase 4 - Mobile Experience

- [ ] Build a dashboard view that summarizes KSN, agency stage, and yield splits.
- [ ] Build a NASA view that shows the latest APOD media and explanatory copy.
- [ ] Build an electricity view that shows country-level price cards and alerts.
- [ ] Build an asset explorer that cycles through the sample infrastructure assets.
- [ ] Add pull-to-refresh and a bottom tab switcher.

## Phase 5 - Verification

- [ ] Build and typecheck the mobile app from the repo root.
- [ ] Smoke test the app entrypoints and data adapters.
- [ ] Verify the final mobile app path is `mobile/`.

