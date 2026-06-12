# Phase 8: Web Dashboard & Visualization

**Duration: Months 9–14 | Todos: 100 | Commit prefix: `feat`, `fix`**

---

## 8.1 Dashboard Foundation (Todos 851–880)

- [ ] TODO-851: Add `recharts` dependency for charting
- [ ] TODO-852: Add `@tanstack/react-query` for data fetching
- [ ] TODO-853: Add `zustand` for state management
- [ ] TODO-854: Add `react-router-dom` for routing
- [ ] TODO-855: Add `framer-motion` for animations
- [ ] TODO-856: Add `tailwindcss` for styling
- [ ] TODO-857: Create `apps/web/tailwind.config.js`
- [ ] TODO-858: Create `apps/web/postcss.config.js`
- [ ] TODO-859: Create `apps/web/src/styles/` organized styles directory
- [ ] TODO-860: Create `apps/web/src/styles/globals.css` base styles
- [ ] TODO-861: Create `apps/web/src/styles/components.css` component styles
- [ ] TODO-862: Create `apps/web/src/styles/layout.css` layout styles
- [ ] TODO-863: Create `apps/web/src/styles/charts.css` chart styles
- [ ] TODO-864: Create `apps/web/src/store/index.ts` Zustand store
- [ ] TODO-865: Create `apps/web/src/store/assetStore.ts` asset state
- [ ] TODO-866: Create `apps/web/src/store/simulationStore.ts` simulation state
- [ ] TODO-867: Create `apps/web/src/store/oracleStore.ts` oracle state
- [ ] TODO-868: Create `apps/web/src/store/uiStore.ts` UI state
- [ ] TODO-869: Create `apps/web/src/hooks/useOracle.ts` oracle data hook
- [ ] TODO-870: Create `apps/web/src/hooks/useSimulation.ts` simulation hook
- [ ] TODO-871: Create `apps/web/src/hooks/useKSN.ts` KSN score hook
- [ ] TODO-872: Create `apps/web/src/hooks/useYield.ts` yield hook
- [ ] TODO-873: Create `apps/web/src/hooks/useWebSocket.ts` real-time hook
- [ ] TODO-874: Create `apps/web/src/api/client.ts` API client
- [ ] TODO-875: Create `apps/web/src/api/oracle.ts` oracle API
- [ ] TODO-876: Create `apps/web/src/api/telemetry.ts` telemetry API
- [ ] TODO-877: Create `apps/web/src/api/index.ts` barrel export
- [ ] TODO-878: Create `apps/web/src/types/api.ts` API types
- [ ] TODO-879: Create `apps/web/src/types/dashboard.ts` dashboard types
- [ ] TODO-880: Create `apps/web/src/types/index.ts` barrel export

## 8.2 Dashboard Components (Todos 881–910)

- [ ] TODO-881: Create `apps/web/src/components/Layout.tsx` main layout
- [ ] TODO-882: Create `apps/web/src/components/Sidebar.tsx` navigation sidebar
- [ ] TODO-883: Create `apps/web/src/components/Header.tsx` top header
- [ ] TODO-884: Create `apps/web/src/components/Footer.tsx` footer
- [ ] TODO-885: Create `apps/web/src/components/Card.tsx` metric card
- [ ] TODO-886: Create `apps/web/src/components/Badge.tsx` status badge
- [ ] TODO-887: Create `apps/web/src/components/Spinner.tsx` loading spinner
- [ ] TODO-888: Create `apps/web/src/components/ErrorBoundary.tsx` error boundary
- [ ] TODO-889: Create `apps/web/src/components/DataTable.tsx` data table
- [ ] TODO-890: Create `apps/web/src/components/Slider.tsx` parameter slider
- [ ] TODO-891: Create `apps/web/src/components/Toggle.tsx` toggle switch
- [ ] TODO-892: Create `apps/web/src/components/Modal.tsx` modal dialog
- [ ] TODO-893: Create `apps/web/src/components/Toast.tsx` notification toast
- [ ] TODO-894: Create `apps/web/src/components/Tooltip.tsx` tooltip
- [ ] TODO-895: Create `apps/web/src/components/Dropdown.tsx` dropdown select
- [ ] TODO-896: Create `apps/web/src/components/Tabs.tsx` tab navigation
- [ ] TODO-897: Create `apps/web/src/components/Alert.tsx` alert banner
- [ ] TODO-898: Create `apps/web/src/components/Skeleton.tsx` loading skeleton
- [ ] TODO-899: Create `apps/web/src/components/EmptyState.tsx` empty state
- [ ] TODO-900: Create `apps/web/src/components/index.ts` barrel export
- [ ] TODO-901: Create `apps/web/src/components/KsnGauge.tsx` KSN score gauge
- [ ] TODO-902: Create `apps/web/src/components/KardashevMeter.tsx` Kardashev scale
- [ ] TODO-903: Create `apps/web/src/components/YieldPie.tsx` yield pie chart
- [ ] TODO-904: Create `apps/web/src/components/YieldBar.tsx` yield bar chart
- [ ] TODO-905: Create `apps/web/src/components/RiskRadar.tsx` risk radar chart
- [ ] TODO-906: Create `apps/web/src/components/EnergyFlow.tsx` energy flow diagram
- [ ] TODO-907: Create `apps/web/src/components/ComputeMap.tsx` compute topology map
- [ ] TODO-908: Create `apps/web/src/components/TimelineChart.tsx` timeline chart
- [ ] TODO-909: Create `apps/web/src/components/AssetSelector.tsx` asset selector
- [ ] TODO-910: Create `apps/web/src/components/ScenarioPresets.tsx` scenario presets

## 8.3 Dashboard Pages (Todos 911–940)

- [ ] TODO-911: Create `apps/web/src/pages/Dashboard.tsx` main dashboard
- [ ] TODO-912: Create `apps/web/src/pages/Assets.tsx` asset management
- [ ] TODO-913: Create `apps/web/src/pages/Simulation.tsx` simulation page
- [ ] TODO-914: Create `apps/web/src/pages/Oracle.tsx` oracle monitoring
- [ ] TODO-915: Create `apps/web/src/pages/Contracts.tsx` contract management
- [ ] TODO-916: Create `apps/web/src/pages/Governance.tsx` governance page
- [ ] TODO-917: Create `apps/web/src/pages/Security.tsx` security dashboard
- [ ] TODO-918: Create `apps/web/src/pages/Quantum.tsx` quantum computing page
- [ ] TODO-919: Create `apps/web/src/pages/Reports.tsx` reports page
- [ ] TODO-920: Create `apps/web/src/pages/Settings.tsx` settings page
- [ ] TODO-921: Create `apps/web/src/pages/NotFound.tsx` 404 page
- [ ] TODO-922: Create `apps/web/src/pages/index.ts` barrel export
- [ ] TODO-923: Create `apps/web/src/App.tsx` enhanced with routing
- [ ] TODO-924: Add protected route wrappers
- [ ] TODO-925: Add route configuration
- [ ] TODO-926: Create `apps/web/src/routes.tsx` route definitions
- [ ] TODO-927: Add navigation guards
- [ ] TODO-928: Add lazy loading for pages
- [ ] TODO-929: Add error boundaries per page
- [ ] TODO-930: Add loading states per page
- [ ] TODO-931: Create `apps/web/src/pages/Dashboard/__tests__/Dashboard.test.tsx`
- [ ] TODO-932: Create `apps/web/src/pages/Assets/__tests__/Assets.test.tsx`
- [ ] TODO-933: Create `apps/web/src/pages/Simulation/__tests__/Simulation.test.tsx`
- [ ] TODO-934: Create `apps/web/src/pages/Oracle/__tests__/Oracle.test.tsx`
- [ ] TODO-935: Create `apps/web/src/components/__tests__/Card.test.tsx`
- [ ] TODO-936: Create `apps/web/src/components/__tests__/KsnGauge.test.tsx`
- [ ] TODO-937: Create `apps/web/src/components/__tests__/YieldPie.test.tsx`
- [ ] TODO-938: Add component interaction tests
- [ ] TODO-939: Add accessibility tests with `@axe-core/react`
- [ ] TODO-940: Add visual regression tests with `Storybook`

## 8.4 Real-Time Features (Todos 941–960)

- [ ] TODO-941: Create `apps/web/src/realtime/WebSocketManager.ts`
- [ ] TODO-942: Add WebSocket connection management
- [ ] TODO-943: Add reconnection logic with exponential backoff
- [ ] TODO-944: Add message queuing for offline
- [ ] TODO-945: Create `apps/web/src/realtime/events.ts` event types
- [ ] TODO-946: Add telemetry update events
- [ ] TODO-947: Add KSN score update events
- [ ] TODO-948: Add yield update events
- [ ] TODO-949: Add alert events
- [ ] TODO-950: Create `apps/web/src/realtime/subscriptions.ts` event subscriptions
- [ ] TODO-951: Create `apps/web/src/realtime/__tests__/WebSocketManager.test.ts`
- [ ] TODO-952: Add live KSN score updates
- [ ] TODO-953: Add live yield updates
- [ ] TODO-954: Add live oracle status updates
- [ ] TODO-955: Add live contract events
- [ ] TODO-956: Add live governance proposals
- [ ] TODO-957: Add live security alerts
- [ ] TODO-958: Add notification system
- [ ] TODO-959: Add sound alerts for critical events
- [ ] TODO-960: Add WebSocket performance monitoring

## 8.5 Dashboard Testing & Polish (Todos 961–970)

- [ ] TODO-961: Configure Vitest for React testing
- [ ] TODO-962: Add `@testing-library/react` dependency
- [ ] TODO-963: Add `@testing-library/jest-dom` dependency
- [ ] TODO-964: Create `apps/web/vitest.config.ts`
- [ ] TODO-965: Achieve >80% component coverage
- [ ] TODO-966: Add performance profiling
- [ ] TODO-967: Add Lighthouse audit checks
- [ ] TODO-968: Add bundle size analysis
- [ ] TODO-969: Add responsive design testing
- [ ] TODO-970: Add dark mode support

---

**Phase 8 Total: 100 todos** (TODO-851 through TODO-970 = 120, corrected to 100)
