# Architecture and design decisions

## Interface

Light, colorful, compact. Warm off-white background, ink text, pale mint/lavender/sky/peach/yellow/rose identity colors, and deep-green primary actions. Native system typography. Semantic tokens support System, Light, and Dark appearance.

Settings offers five app themes: Botanical (original soft green), Electric (cobalt with outlined cards and offset shadows), Clay (warm terracotta), Paper (flat monochrome with square corners), and Bloom (rounded violet with soft shadows). Each has a full light and dark palette. Semantic radius, border, and shadow tokens style cards, controls, and sheets; circular completion controls and gapless compact history retain their functional shapes. Habit identity colors are independent.

Appearance mode and color theme are separate per-device preferences, applied before React renders and synchronized between tabs. Invalid or inaccessible local storage falls back to Botanical/System; selections still apply for the current session if storage is unavailable. These cosmetic preferences do not affect the Firebase account, habits, entries, or backup schema. Preview cards use the same tokens as the full app, including dark palettes. Browser theme color follows the selected palette.

Today, History, Settings. Four starter habits are optional. Completion never reorders habits. Status is conveyed by shape and text as well as color. Primary tap targets are 48px; all interactive targets at least 44px.

## Boundaries

- Domain: pure date, habit-rule, completion, streak, and backup validation functions.
- Data: Firebase persistence and offline caching, authentication, sync state, and import/export.
- UI: feature screens and accessible modal sheets.

## Persistence

Google sign-in is mandatory; no guest profile or local-only writes. Legacy local data is read only for backup recovery and never deleted by the upgrade. Versioned user settings, habits, effective-dated rule revisions, and entries under `/users/{uid}`. Entry IDs combine stable habit ID and local calendar date. Firestore uses last-write-wins for concurrent edits of the same entry. Personal-device offline persistence is enabled; sign-out clears user-specific caches.

Each date retains the schedule/target rule that applied then. Unscheduled days are neutral. Missing past scheduled entries break streaks but remain visibly different from explicit failures. Today is pending until the saved timezone crosses midnight. Sleep is recorded on the waking date.

## Operations

Firebase Spark only. Static Hosting, Firestore, Google authentication. No Functions, notification scheduler, file storage, or billing upgrade. Never claim a remote save before it is acknowledged. Export/import uses a versioned, fully validated JSON format.
