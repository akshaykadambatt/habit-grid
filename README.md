# habit-grid

A quiet place to build consistency. A phone-first habit tracker with quick check-ins, a colorful history grid, and Firebase sync.

**[Open the app](https://habit-grid-akn6.web.app)** · **[Public source](https://github.com/akshaykadambatt/habit-grid)**

## Product

- Today: one-tap checkboxes, numeric targets, recent history, and undo.
- History: editable habit-by-day grid, streaks, and weekly review.
- Settings: habit management, timezone, backup, and iPhone installation help.
- React + TypeScript + Vite. Firebase Authentication, Firestore, and static Hosting on Spark. No notifications, billing services, or health prescriptions.

See [the roadmap](docs/ROADMAP.md) and [architecture](docs/ARCHITECTURE.md).

## Development

Requires Node.js 22 or later. Run `npm ci`, then `npm run dev`. Without Firebase configuration the app offers an explicitly device-local mode. Configure `.env.local` from `.env.example` to enable Google sign-in and cloud sync.

Run `npm run check` for type checking, unit tests, and a production PWA build. Run `npm run test:rules` with Firebase CLI and Java 21 for Firestore ownership/validation tests. Browser tests: `npx playwright install chromium webkit`, then `npm run test:e2e` after a build.

## Firebase setup and deployment

1. Use a **Spark** project. Enable Google sign-in, create a Firestore Standard database, and add a Firebase web app.
2. Copy the web SDK configuration into `.env.local` using `.env.example`. These are client configuration values, not service-account credentials. Never place admin credentials in Vite environment variables.
3. Set your project in `.firebaserc`. Authorize your Hosting domain and development host under Authentication settings.
4. Run `npm run check`, `npm run test:rules`, then `firebase deploy --only hosting,firestore`.

Use the domain serving the app as `VITE_FIREBASE_AUTH_DOMAIN` (for this deployment, `habit-grid-akn6.web.app`), and authorize `https://<domain>/__/auth/handler` in Google's OAuth redirect URIs. The SDK also selects the current project's Hosting domain automatically. Keep Firebase's `/__/` routes outside the service-worker navigation fallback. Phones and installed PWAs use same-tab Google sign-in; desktop browsers use a popup with a redirect fallback when blocked. Returned sign-in errors are shown on the sign-in screen.

The configured deployment uses `habit-grid-akn6` with Firestore in Montréal (`northamerica-northeast1`). No billing account, Functions, notification scheduler, or Cloud Storage is needed. Deployment is manual; GitHub Actions validates changes but does not hold Firebase deployment credentials.

## iPhone installation

Open the app in Safari, tap Share → Add to Home Screen, and keep Open as Web App enabled if shown. After an initial online visit, the application shell and cached habits are available offline. Pending cloud changes sync when reconnected. A physical-device acceptance check is still required for a release certification; desktop device emulation is not a substitute.

## Data behavior

Missing entries never count as success. Rest days are neutral. Past missed/unlogged scheduled days break streaks; today’s unlogged entry stays pending. Schedule and target changes preserve older rule versions. Sleep belongs to the waking date.

In History, tap an existing date to edit it, or a **+** to log a day before the habit's current start. Saving an earlier entry moves the start back using its original schedule and target; later rule changes remain intact. Scheduled days from the new start count in reviews and streaks. The start change and entry save together; Undo restores both unless the habit has since been edited elsewhere. Rest days and future dates remain unavailable.

Local mode and cloud profiles are separate. Export a local backup and import it after sign-in to move local data to your account. Cloud imports stage a new dataset and switch only after all records are uploaded; previous datasets remain inactive in Firestore for recoverability. This version supports 200 habits (including archived), 50,000 backup entries, and 10 MB backup files.

Google sign-out clears the device’s cloud cache. Close other app tabs if cache clearing cannot complete. Export backups regularly in device-local mode.

## Privacy

Do not commit credentials, exported habits, or service-account files. Each signed-in account can access only its own records. This repository currently has no open-source license.
