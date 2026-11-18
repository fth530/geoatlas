# GeoKPSS Roadmap

## Phase 1 — Learning loop (current)
- [x] Keep study progress, notes, and quiz results on the device.
- [x] Show immediate correct/incorrect feedback on the silent map.
- [x] Map quizzes for every layer + all 81 provinces + mixed mode.
- [x] Spaced review scheduling and due items surfaced in Konu Takibi.
- [x] Personal notes linked to map features.
- [x] First-run onboarding.
- [x] Study statistics tab (accuracy, topic status, per-layer mastery).
- [x] Study data export/import (JSON backup via share sheet).
- [ ] More verified questions and explanations per layer.
- [ ] Province-level MCQs (81 provinces) in the question bank.

## Phase 2 — Broader practice
- [x] Question formats: MCQ bank + "Neden-sonuç" cause-effect questions (`ITEM_CAUSE`, tagged in UI).
- [x] MCQ bank: all 158 items covered (297 item questions) + 162 province questions.
- [x] Content references: `LAYER_SOURCES` per-layer defaults + optional per-item `source`, shown in detail panel.
- [x] Weak-first question ordering (items/provinces answered incorrectly recently surface first).
- [x] Timed exam simulation mode: "Deneme" — 10 random MCQs, 5-minute countdown, score screen with restart.
- [x] Content expansion toward the full KPSS physical-geography syllabus — 150 map items reached.

## Phase 3 — Study continuity
- [x] Versioned, sanitized local store (`version: 2`) + JSON export/import (share sheet, filename title, paste-restore).
- [ ] Cloud sync — deferred: no backend by design; file-based restore covers device transfer.
- [x] Offline first-run behavior: onboarding states all content works offline.
- [x] Study reminders: daily 19:00 local notification toggle (expo-notifications, Android channel, permission-gated).

## Phase 4 — Pro options
- [ ] Advanced reports, custom question sets, expanded study packs.
- [ ] Keep core map exploration, topic tracking, notes, and quiz free.
- [ ] No paywall until the user explicitly chooses a monetization plan.

## Phase 5 — UI/UX polish
- [x] Quiz: grouped mode selector (HARİTA/SINAV), question entrance animation, exam accuracy ring + per-layer breakdown.
- [x] Map detail panel: quiz shortcut, note shortcut with count, source reference.
- [x] Stats: accuracy bar, per-layer progress, top-weak list, empty-state CTA, import confirmation.
- [x] Topics: live per-topic stats + quiz shortcut; tab badge for due reviews.
- [x] Onboarding: paged carousel with dots, skip/next flow, press feedback.
- [x] Tactile feedback: PressableScale on primary CTAs (quiz, map detail, stats).
- [x] Map perf: memoized province/marker layers — pinch zoom no longer reconciles 81 paths per frame.
- [x] Quiz correct-answer card bounce: prompt card spring + BounceIn feedback card.
- [x] Map selection pulse indicator (province ring + active item marker).
- [ ] Human-geography content (nüfus, iklim, tarım, sanayi, ulaşım) — currently physical geography only.
- [ ] Per-item source verification / editorial pass on all 158 items.
- [ ] Real-device QA: gestures, notifications, dark mode, safe-area edges.

## Content inventory (post-expansion)
- Provinces: 81 (full GeoJSON boundaries)
- Map items: 326 across 11 layers — mountains 39, lakes 30, plains 29, rivers 27, coasts 34 (incl. karstic/wind/fluvial shapes + kalanklı/limanlı kıyılar), geology 21, soil 19, minerals 36 (incl. termik santraller, nükleer), projects 57 (incl. ZBK/YİH/DOKAP, 14 Ramsar, UNESCO, barajlar), transport 28 (YHT, geçit/tünel, boru hatları, sınır kapıları); per-mineral chips (Bakır, Krom, Civa...), short project filters (GAP/KOP/DAP/ZBK/YİH/DOKAP), winter/summer tourism filters
- MCQ bank: authored questions + deterministic province fallback ensures all 320 items have >=1 question + 162 province questions.
- Map UX: selected item's provinces highlight on the map; multi-province items show province chips in the detail card.
- Still thin: coasts improved to 16; no human-geography topics yet.

## Current review behavior
- A newly answered item is due again after one day.
- Correct consecutive reviews expand the interval to 3, 7, 14, and then 30 days.
- An incorrect answer resets the interval to one day.
- Manually marked `done` topics are never downgraded by quiz answers.
- Mixed mode interleaves all 81 province questions with every map item; answers record against the correct topic layer.
- [x] Map visual evolution: sea gradient + frame, province silhouette shadow, per-layer marker glyphs (triangle/ring/wave/gem/star/dart), sparse-item name labels, high-zoom province names, legend counts
