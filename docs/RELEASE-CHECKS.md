# Release checks

## Automated

- Domain: calendar boundaries, saved timezone midnight, inclusive numeric targets, effective-dated rules, rest days, explicit failure, unlogged days, archived history, and weekly denominators.
- Backup: round trip, unsupported formats, duplicate IDs, corrupt schedules/dates/timezones, unknown fields, and orphan entries.
- Firestore emulator: ownership, anonymous denial, cross-user denial, entry ID/field validation, and malformed settings.
- Browser suite: check-ins, undo, numeric validation, reload persistence, creation/archive, responsive targets, and service-worker offline reload in Chromium and WebKit.
- CI runs the application build, tests, and Firestore rules checks without access to production data.

## Manual browser checks performed

Test data is synthetic and stored in a separate device-local browser profile.

- Starter selection, checkbox and numeric logging, unsuccessful status, historical cell editing, creation, reordering, and archiving.
- Local persistence after reload.
- Widths 320, 375, 390, 430, 768, and 1440: no page-level horizontal overflow in Today; primary controls at least 44px, completion controls 48px high.
- Phone and desktop Today screenshots visually reviewed.
- Remaining screen/backup and cloud acceptance results are recorded in the release PR.

## Physical device acceptance (not yet certified)

On a real iPhone: Google sign-in; Add to Home Screen; standalone relaunch; decimal keyboard and sheet fit; VoiceOver; larger accessibility text; offline reload and queued cloud writes; reconnect; sign out; verify phone/desktop cloud synchronization.

Dark mode is a future sprint. No notifications are present.
