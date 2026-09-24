import { useRef, useState } from "react";
import {
  ArrowUp,
  ArrowDown,
  ArrowUpRight,
  Download,
  Upload,
  Share2,
  LogOut,
  Cloud,
  SlidersHorizontal,
} from "lucide-react";
import { Sheet } from "../components/Sheet";
import { HabitIcon } from "../components/HabitRow";
import { login, logout } from "../data/firebase";
import { exportBackup, parseBackup } from "../domain/backup";
import {
  localDate,
  type Data,
  type Habit,
  type Settings as SettingsType,
} from "../domain/model";
import type { User } from "firebase/auth";
export function Settings({
  data,
  user,
  onHabits,
  onSettings,
  onImport,
  onEdit,
  onInstall,
  onAdd,
  pending,
}: {
  data: Data;
  user: User | null;
  onHabits: (habits: Habit[]) => void;
  onSettings: (settings: SettingsType) => void;
  onImport: (data: Data) => Promise<void>;
  onEdit: (habit: Habit) => void;
  onInstall: () => void;
  onAdd: () => void;
  pending: boolean;
}) {
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [timezone, setTimezone] = useState(data.settings.timezone);
  const [incoming, setIncoming] = useState<Data | null>(null);
  const [busy, setBusy] = useState(false);
  const [signout, setSignout] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const active = data.habits.filter((h) => !h.archivedOn);
  const archived = data.habits.filter((h) => h.archivedOn);
  const timezones = Array.from(
    new Set([
      data.settings.timezone,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      "UTC",
      ...Intl.supportedValuesOf("timeZone"),
    ]),
  );
  function reorder(index: number, change: number) {
    const moved = [...active];
    [moved[index], moved[index + change]] = [
      moved[index + change],
      moved[index],
    ];
    onHabits([
      ...moved.map((h, i) => ({ ...h, order: i })),
      ...archived.map((h, i) => ({ ...h, order: moved.length + i })),
    ]);
  }
  function backup() {
    setError("");
    const next = {
      ...data,
      settings: { ...data.settings, lastBackup: new Date().toISOString() },
    };
    const url = URL.createObjectURL(
      new Blob([exportBackup(next)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `habit-grid-${localDate(data.settings.timezone)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    onSettings(next.settings);
    setMessage("Backup downloaded. Keep it somewhere safe.");
  }
  async function importFile(file?: File) {
    if (!file) return;
    setError("");
    try {
      if (file.size > 10_000_000)
        throw new Error("Choose a backup smaller than 10 MB.");
      setIncoming(parseBackup(await file.text()));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read this backup.");
    } finally {
      if (input.current) input.current.value = "";
    }
  }
  async function replace() {
    if (!incoming) return;
    setBusy(true);
    setError("");
    try {
      await onImport(incoming);
      setIncoming(null);
      setTimezone(incoming.settings.timezone);
      setMessage("Your backup has been restored.");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "The import failed. Your existing data is still active.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function connect() {
    try {
      setError("");
      await login();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in did not complete.");
    }
  }
  return (
    <div className="settings-layout">
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="success-message">
          {message}
        </p>
      )}
      <section className="settings-section">
        <div className="settings-heading">
          <h2>Your account</h2>
          <Cloud size={20} />
        </div>
        <p className="settings-value">{user?.email || "This device only"}</p>
        <p className="help-text">
          {user
            ? "Your habits are private and sync with your Google account."
            : "Your progress is stored in this browser. Export a backup before clearing browser data. Signing in opens your separate cloud profile; export first to move these habits there."}
        </p>
        {user ? (
          <button className="secondary-button" onClick={() => setSignout(true)}>
            <LogOut size={17} />
            Sign out
          </button>
        ) : (
          <button className="primary-button" onClick={connect}>
            <Cloud size={18} />
            Connect Google
          </button>
        )}
      </section>
      <section className="settings-section">
        <div className="settings-heading">
          <h2>
            Your habits <span>{active.length}</span>
          </h2>
          <button className="text-button" onClick={onAdd}>
            Add habit <ArrowUpRight size={17} />
          </button>
        </div>
        {active.length ? (
          active.map((habit, index) => (
            <div className={`manage-row ${habit.color}`} key={habit.id}>
              <span className="habit-icon">
                <HabitIcon habit={habit} />
              </span>
              <button className="manage-name" onClick={() => onEdit(habit)}>
                {habit.name}
              </button>
              <div className="reorder-buttons">
                <button
                  className="icon-button"
                  disabled={index === 0}
                  aria-label={`Move ${habit.name} up`}
                  onClick={() => reorder(index, -1)}
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  className="icon-button"
                  disabled={index === active.length - 1}
                  aria-label={`Move ${habit.name} down`}
                  onClick={() => reorder(index, 1)}
                >
                  <ArrowDown size={16} />
                </button>
              </div>
              <button
                className="icon-button"
                aria-label={`Edit ${habit.name}`}
                onClick={() => onEdit(habit)}
              >
                <SlidersHorizontal size={17} />
              </button>
            </div>
          ))
        ) : (
          <p className="help-text">No active habits yet. Start with one.</p>
        )}
        {archived.length > 0 && (
          <details className="archived-list">
            <summary>
              {archived.length} archived{" "}
              {archived.length === 1 ? "habit" : "habits"}
            </summary>
            {archived.map((h) => (
              <div key={h.id}>
                {h.name}
                <span>History preserved</span>
              </div>
            ))}
          </details>
        )}
      </section>
      <section className="settings-section">
        <h2>Your day</h2>
        <p className="help-text">
          Days turn over at midnight in this timezone. Existing entries keep
          their calendar dates.
        </p>
        <label className="field">
          <span>Tracking timezone</span>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
          >
            {timezones.map((t) => (
              <option key={t} value={t}>
                {t.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <button
          className="secondary-button"
          disabled={timezone === data.settings.timezone}
          onClick={() => {
            onSettings({ ...data.settings, timezone });
            setMessage("Tracking timezone updated.");
          }}
        >
          Save timezone
        </button>
      </section>
      <section className="settings-section">
        <h2>A copy for you</h2>
        <p className="help-text">
          Download your habits and history as a private JSON backup. Imports
          replace the habits and history shown in your account.
        </p>
        <div className="button-row">
          <button className="secondary-button" onClick={backup}>
            <Download size={18} />
            Export backup
          </button>
          <button
            className="secondary-button"
            onClick={() => input.current?.click()}
            disabled={pending}
          >
            <Upload size={18} />
            Import backup
          </button>
          <input
            ref={input}
            type="file"
            accept=".json,application/json"
            className="sr-only"
            aria-label="Choose habit backup"
            onChange={(e) => void importFile(e.target.files?.[0])}
          />
        </div>
        {data.settings.lastBackup && (
          <p className="help-text">
            Last export:{" "}
            {new Date(data.settings.lastBackup).toLocaleDateString()}
          </p>
        )}
        {(!data.settings.lastBackup ||
          Date.now() - Date.parse(data.settings.lastBackup) >
            30 * 86400000) && (
          <p className="backup-note">A monthly backup is a good habit, too.</p>
        )}
      </section>
      <section className="settings-section">
        <div className="settings-heading">
          <h2>Make room on your home screen</h2>
          <Share2 size={20} />
        </div>
        <p className="help-text">
          Open habit-grid like an app. No download from the App Store needed.
        </p>
        <button className="secondary-button" onClick={onInstall}>
          iPhone installation guide <ArrowUpRight size={17} />
        </button>
      </section>
      <p className="settings-footnote">
        habit-grid · v0.1.0
        <br />
        Your goals. Your own pace.
      </p>
      {incoming && (
        <Sheet
          title="Replace with this backup?"
          onClose={() => {
            if (!busy) setIncoming(null);
          }}
        >
          <p className="help-text">
            This backup contains {incoming.habits.length} habits and{" "}
            {Object.keys(incoming.entries).length} entries. It will replace what
            you currently see. Export your current data first if you want to
            keep a copy.
          </p>
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
          <div className="sheet-actions">
            <button
              className="secondary-button"
              disabled={busy}
              onClick={() => setIncoming(null)}
            >
              Cancel
            </button>
            <button
              className="primary-button"
              disabled={busy}
              onClick={() => void replace()}
            >
              {busy ? "Restoring…" : "Replace data"}
            </button>
          </div>
        </Sheet>
      )}
      {signout && (
        <Sheet
          title="Sign out of habit-grid?"
          onClose={() => setSignout(false)}
        >
          <p className="help-text">
            Your synced history stays in your account. This device’s cloud cache
            will be cleared.
          </p>
          {pending && (
            <p className="error-message">
              Wait for your changes to finish syncing before signing out.
            </p>
          )}
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
          <div className="sheet-actions">
            <button
              className="secondary-button"
              onClick={() => setSignout(false)}
            >
              Cancel
            </button>
            <button
              className="primary-button"
              disabled={pending || busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await logout();
                } catch {
                  setError(
                    "Close other habit-grid tabs, then try signing out again.",
                  );
                  setBusy(false);
                }
              }}
            >
              Sign out
            </button>
          </div>
        </Sheet>
      )}
    </div>
  );
}
