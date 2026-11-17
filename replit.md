# GeoKPSS

Offline-first Expo/React Native app for KPSS geography practice: an interactive Turkey map, map quizzes, spaced-repetition review, topic tracking, and a personal notes journal. All study data lives on the device (AsyncStorage); there is no backend.

## Run & Operate

- `pnpm --filter @workspace/geokpss-mobile run dev` — Expo dev server
- `pnpm --filter @workspace/geokpss-mobile run typecheck` — mobile typecheck
- `pnpm --filter @workspace/geokpss-mobile run test` — unit tests (node:test via tsx)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo SDK 58, React Native 0.88, expo-router, react-native-svg, react-native-gesture-handler + reanimated
- Persistence: `@react-native-async-storage/async-storage` (single versioned JSON blob, see `artifacts/geokpss-mobile/utils/study.ts`)
- Tests: `node:test` run through `tsx` (`artifacts/geokpss-mobile/tests/`)

## Where things live

- `artifacts/geokpss-mobile/app/` — expo-router screens (tabs: map, quiz, topics, notes; `pro` modal)
- `artifacts/geokpss-mobile/data/geography.ts` — layers, filters, map items, topics
- `artifacts/geokpss-mobile/data/turkiye_iller.json` — province GeoJSON (ODbL, OpenStreetMap)
- `artifacts/geokpss-mobile/components/TurkeyMap.tsx` — SVG map, gestures, quiz overlay
- `artifacts/geokpss-mobile/utils/` — pure helpers (study scheduler, geo projection) — keep RN-free so tests can import them
- `artifacts/geokpss-mobile/context/` — StudyContext (progress/notes/reviews) and ThemeContext
- `artifacts/mockup-sandbox/` — shadcn UI mockup sandbox (design reference only)

## Architecture decisions

- Fully offline: the app bundles all geography content; no API server or database.
- Study state is one versioned AsyncStorage blob (`geokpss-study-v1`, payload `version: 2`); loads are sanitized field-by-field in `utils/study.ts`.
- Quiz/review logic is extracted into pure functions in `utils/study.ts` so it is unit-testable without React Native.
- `TurkeyMap` uses a fixed equirectangular projection (`utils/geo.ts`) over bundled GeoJSON; province "holes" rely on SVG `fill-rule="evenodd"`.
- Map features render one marker per province the feature belongs to, with a golden-angle spiral offset per province to avoid overlap.

## Product

GeoKPSS helps KPSS candidates learn Turkish geography on an interactive map: browse 10 layers (provinces, mountains, lakes, plains, rivers, coasts, geology, soil, minerals, projects), take silent-map quizzes, review due items via spaced repetition, track topic mastery, and keep personal mnemonic notes.

## Gotchas

- `utils/` files must stay free of React Native / `@/` runtime imports so `tsx tests/run.ts` works in plain Node.
- Quiz `mode` params accept every `LayerId`; review sessions are keyed `layer:targetId`.
- Manually marking a topic `done` is sticky — quiz answers never downgrade it.
