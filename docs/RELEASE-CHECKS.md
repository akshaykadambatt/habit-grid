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
- History with 12 synthetic habits and 210 entries, weekly review, long-name wrapping, entry sheets, and Settings visually reviewed on a phone viewport.
- Valid backup import and unsupported-version rejection checked through the UI. Unit tests cover round trips and corrupt inputs.
- Firebase Google provider and authorized Hosting domains configured; billing remains disabled. The reporting user confirmed Google sign-in in phone Chrome after the same-origin auth fix. Cross-device writes have not yet been certified.
- Optional, feature-detected WebMCP tools verified on the deployed app: listing today's habits returned the visible synthetic profile, and opening a check-in displayed the matching sheet without recording a completion.

The offline browser test stops its own HTTP origin after the service worker has taken control, then reloads and checks in from cache before restoring the origin. This avoids a known Playwright WebKit offline-emulation issue while still requiring a working cached app shell. It does not certify Firestore offline-to-online synchronization.

## Physical device acceptance (not yet certified)

On a real iPhone: Google sign-in; Add to Home Screen; standalone relaunch; decimal keyboard and sheet fit; VoiceOver; larger accessibility text; offline reload and queued cloud writes; reconnect; sign out; verify phone/desktop cloud synchronization.

Dark mode includes System/Light/Dark selection, persisted per device before initial rendering, system-change handling, semantic surfaces, contrasting controls, and matching browser theme color. Tests check core light/dark text and control contrast plus preference persistence. PWA icon artwork is generated from a shared SVG with mask-safe padding. No notifications are present.
