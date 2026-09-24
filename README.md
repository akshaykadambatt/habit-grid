# habit-grid

A quiet place to build consistency. A phone-first habit tracker with quick check-ins, a colorful history grid, and Firebase sync.

## Product

- Today: one-tap checkboxes, numeric targets, recent history, and undo.
- History: editable habit-by-day grid, streaks, and weekly review.
- Settings: habit management, timezone, backup, and iPhone installation help.
- React + TypeScript + Vite. Firebase Authentication, Firestore, and static Hosting on Spark. No notifications, billing services, or health prescriptions.

See [the roadmap](docs/ROADMAP.md) and [architecture](docs/ARCHITECTURE.md).

## Development

Requires Node.js 22 or later. Run `npm ci`, then `npm run dev`. Without Firebase configuration the app offers an explicitly device-local mode. Configure `.env.local` from `.env.example` to enable Google sign-in and cloud sync.

Run `npm run check` for type checking, unit tests, and a production build. Deployment and emulator instructions are added alongside Firebase configuration.

## Privacy

Do not commit credentials, exported habits, or service-account files. Each signed-in account can access only its own records. This repository currently has no open-source license.
