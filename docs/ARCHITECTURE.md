# Architecture and design decisions

## Interface

Light, colorful, compact. Warm off-white background, ink text, pale mint/lavender/sky/peach/yellow/rose identity colors, and deep-green primary actions. Native system typography. Semantic tokens leave room for a later dark theme.

Today, History, Settings. Four starter habits are optional. Completion never reorders habits. Status is conveyed by shape and text as well as color. Primary tap targets are 48px; all interactive targets at least 44px.

## Boundaries

- Domain: pure date, habit-rule, completion, streak, and backup validation functions.
- Data: Firebase/local persistence, authentication, sync state, and import/export.
- UI: feature screens and accessible modal sheets.

## Persistence

Versioned user settings, habits, effective-dated rule revisions, and entries under `/users/{uid}`. Entry IDs combine stable habit ID and local calendar date. Firestore uses last-write-wins for concurrent edits of the same entry. Personal-device offline persistence is enabled; sign-out clears user-specific caches.

Each date retains the schedule/target rule that applied then. Unscheduled days are neutral. Missing past scheduled entries break streaks but remain visibly different from explicit failures. Today is pending until the saved timezone crosses midnight. Sleep is recorded on the waking date.

## Operations

Firebase Spark only. Static Hosting, Firestore, Google authentication. No Functions, notification scheduler, file storage, or billing upgrade. Never claim a remote save before it is acknowledged. Export/import uses a versioned, fully validated JSON format.
