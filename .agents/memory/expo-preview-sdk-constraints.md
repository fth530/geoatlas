---
name: Expo preview and SDK release constraints
description: Replit Expo web rendering and package version alignment behavior.
---

In Replit’s Expo web preview, avoid returning `null` during SSR only because fonts have not loaded. Render web with a system-font fallback while retaining font and splash gating on native. Use native gesture and tab components only on supported native platforms; the web route needs a normal view and tabs.

**Why:** The preview rendered blank until SSR could render the app. Gesture and navigation wrappers also produced browser-only responder warnings. Expo’s dependency check found SDK patch mismatches, but package installation was blocked by the registry’s minimum release-age policy.

**How to apply:** When Expo preview is blank or shows React Native responder warnings, inspect rendered HTML and isolate platform-specific wrappers before changing screen layout. Do not bypass release-age safeguards solely to clear patch-level dependency warnings.
