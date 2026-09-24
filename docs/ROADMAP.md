# Delivery roadmap

Each sprint is a small reviewable increment. A sprint is complete only when its acceptance criteria have been verified. External-account setup and real-device checks must be reported separately from implementation.

| Sprint     | Deliverable                             | Acceptance                                                |
| ---------- | --------------------------------------- | --------------------------------------------------------- |
| 0          | Public repository and decision records  | Public source, no secrets                                 |
| 1          | Design tokens and Today prototype       | Readable four-habit phone layout, generous targets        |
| 2          | History and accessible sheets           | Scrollable grid, clear states, text wrapping              |
| 3          | Habit domain and app shell              | Schedule, target, date, and streak tests                  |
| 4          | Firebase persistence and authentication | Ownership tests; offline persistence                      |
| 5          | Daily check-ins                         | Checkbox, numeric entry, failure, clear, undo             |
| 6          | Habit management                        | Create, edit, order, archive; preserved historical rules  |
| 7          | History and review                      | Correct historical edits and weekly progress              |
| 8          | Home-screen release                     | Hosting, offline shell, iPhone installation instructions  |
| 9          | Backup and hardening                    | Validated import/export; accessibility and browser checks |
| 10 (later) | Dark theme                              | System/light/dark with all states verified                |

## Small tasks and review boundaries

Each row is one focused PR, with three tasks small enough to review independently. Sprints 1–9 are implemented and merged as PRs #1–#9. Release refinements and browser acceptance live in PR #10. Physical-device and authenticated cross-device acceptance remain open; implementation is not certification.

| Sprint     | Tasks                                                                                                                            |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 0          | Initialize public main branch; record design/architecture decisions; document delivery and privacy boundaries                    |
| 1          | Establish semantic tokens; build four Today rows; verify phone hierarchy and targets                                             |
| 2          | Build pinned history grid; add accessible sheet shell; check all five cell states                                                |
| 3          | Implement date and rule engine; connect three navigation destinations; test schedules, thresholds, and streaks                   |
| 4          | Connect Google auth; implement owned Firestore records and cache; test security rules                                            |
| 5          | Connect checkbox and numeric writes; implement clear/not-met/undo; verify daily flow and errors                                  |
| 6          | Build creation and effective-dated editing; add stable reorder; confirm archival with preserved history                          |
| 7          | Connect historical edits; calculate weekly denominators and streaks; verify rest days and missing information                    |
| 8          | Add manifest and service worker; deploy on Firebase Spark; verify cached reload and document real-iPhone acceptance              |
| 9          | Implement versioned backup round trips; refine accessibility and operational states; run responsive and cross-browser acceptance |
| 10 (later) | Add system/light/dark preference; extend semantic tokens; verify every screen and state in both themes                           |

## Future features

Detailed food/workout/sleep records; flexible times-per-week goals; device integrations; private accountability buddies. Keep Today fast. Use stable habit IDs and versioned records. Do not build a generic plugin framework before it is needed.
