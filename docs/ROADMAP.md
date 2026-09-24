# Delivery roadmap

Each sprint is a small reviewable increment. A sprint is complete only when its acceptance criteria have been verified. External-account setup and real-device checks must be reported separately from implementation.

| Sprint | Deliverable | Acceptance |
| --- | --- | --- |
| 0 | Public repository and decision records | Public source, no secrets |
| 1 | Design tokens and Today prototype | Readable four-habit phone layout, generous targets |
| 2 | History and accessible sheets | Scrollable grid, clear states, text wrapping |
| 3 | Habit domain and app shell | Schedule, target, date, and streak tests |
| 4 | Firebase persistence and authentication | Ownership tests; offline persistence |
| 5 | Daily check-ins | Checkbox, numeric entry, failure, clear, undo |
| 6 | Habit management | Create, edit, order, archive; preserved historical rules |
| 7 | History and review | Correct historical edits and weekly progress |
| 8 | Home-screen release | Hosting, offline shell, iPhone installation instructions |
| 9 | Backup and hardening | Validated import/export; accessibility and browser checks |
| 10 (later) | Dark theme | System/light/dark with all states verified |

## Future features

Detailed food/workout/sleep records; flexible times-per-week goals; device integrations; private accountability buddies. Keep Today fast. Use stable habit IDs and versioned records. Do not build a generic plugin framework before it is needed.
