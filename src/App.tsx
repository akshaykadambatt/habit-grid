import { useEffect, useState } from "react";
import { Plus, LayoutGrid, CalendarDays, Settings2 } from "lucide-react";
import { useAgentTools } from "./data/useAgentTools";
import { useHabits } from "./data/useHabits";
import {
  localDate,
  formatDate,
  ruleOn,
  dayState,
  entryId,
  type Entry,
  type Habit,
} from "./domain/model";
import { Today } from "./features/Today";
import { Welcome, ChooseHabits } from "./features/Onboarding";
import { EntrySheet } from "./features/EntrySheet";
import { AppUpdate } from "./components/AppUpdate";
import { Sheet } from "./components/Sheet";
import { Settings } from "./features/Settings";
import { History } from "./features/History";
import { HabitEditor } from "./features/HabitEditor";

type Page = "today" | "history" | "settings";
export default function App() {
  const store = useHabits();
  const { data } = store;
  const [page, setPage] = useState<Page>("today");
  const [now, setNow] = useState(new Date());
  const today = localDate(data.settings.timezone, now);
  const [entryTarget, setEntryTarget] = useState<{
    habit: Habit;
    date: string;
  } | null>(null);
  useAgentTools(
    data,
    today,
    (habit, date) => setEntryTarget({ habit, date }),
    data.settings.onboarded,
  );
  const [info, setInfo] = useState<string | null>(null);
  const [editor, setEditor] = useState<Habit | "new" | null>(null);
  const [undo, setUndo] = useState<{ message: string; previous: Entry } | null>(
    null,
  );
  useEffect(() => {
    const update = () => setNow(new Date());
    const timer = setInterval(update, 15000);
    document.addEventListener("visibilitychange", update);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  useEffect(() => {
    if (!undo) return;
    const timer = setTimeout(() => setUndo(null), 8000);
    return () => clearTimeout(timer);
  }, [undo]);
  function navigate(next: Page) {
    setPage(next);
    window.scrollTo({ top: 0 });
  }
  function save(
    habit: Habit,
    date: string,
    status: Entry["status"],
    value: number | null,
  ) {
    const previous = data.entries[entryId(habit.id, date)] || {
      habitId: habit.id,
      date,
      status: "unlogged",
      value: null,
      updatedAt: new Date().toISOString(),
    };
    try {
      store.saveEntry({
        habitId: habit.id,
        date,
        status,
        value,
        updatedAt: new Date().toISOString(),
      });
      setUndo({
        message:
          status === "unlogged" ? "Entry cleared" : `${habit.name} updated`,
        previous,
      });
      setEntryTarget(null);
    } catch {
      /* Store exposes persistence errors. */
    }
  }
  function check(habit: Habit) {
    if (ruleOn(habit, today)?.kind === "number") {
      setEntryTarget({ habit, date: today });
      return;
    }
    save(
      habit,
      today,
      dayState(habit, today, data.entries, today) === "met"
        ? "unlogged"
        : "met",
      null,
    );
  }
  function begin(habits: Habit[]) {
    store.saveHabits(habits);
    store.saveSettings({ ...data.settings, onboarded: true });
  }
  const syncText = {
    loading: "Loading your habits…",
    local: "Saved on this device",
    synced: "All changes synced",
    pending: "Waiting to sync",
    offline: "Offline · saved on this device",
    error: "Could not sync",
  }[store.sync];
  if (!store.authReady)
    return (
      <div className="loading-screen" aria-label="Loading">
        <div className="skeleton" />
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
    );
  if (!store.user && !store.localMode)
    return <Welcome onLocal={store.startLocal} />;
  const activeCount = data.habits.filter((h) => !h.archivedOn).length;
  const navigation = (mobile = false) => (
    <nav
      className={mobile ? "mobile-nav" : ""}
      aria-label={mobile ? "Mobile navigation" : "Main navigation"}
    >
      {(
        [
          { key: "today", label: "Today", Icon: LayoutGrid },
          { key: "history", label: "History", Icon: CalendarDays },
          { key: "settings", label: "Settings", Icon: Settings2 },
        ] as const
      ).map(({ key, label, Icon }) => (
        <button
          className={`${mobile ? "" : "nav-item"} ${page === key ? "active" : ""}`}
          aria-current={page === key ? "page" : undefined}
          key={key}
          onClick={() => navigate(key)}
        >
          <Icon size={20} />
          {label}
          {!mobile && key === "today" && (
            <span className="nav-count">{activeCount}</span>
          )}
        </button>
      ))}
    </nav>
  );
  return (
    <div className="app-shell">
      <AppUpdate />
      <aside className="sidebar">
        <a
          className="brand"
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigate("today");
          }}
        >
          <img src="/favicon.svg" alt="" />
          habit-grid
        </a>
        <div className="side-caption">A LITTLE, EVERY DAY</div>
        {navigation()}
        <div className="sidebar-bottom">
          <div className="tiny-grid" aria-hidden="true">
            {Array.from({ length: 20 }, (_, i) => (
              <i key={i} style={{ opacity: ((i % 4) + 1) / 4 }} />
            ))}
          </div>
          <p>
            Small steps.
            <br />A bigger picture.
          </p>
          <span>YOUR SPACE TO KEEP GOING</span>
        </div>
      </aside>
      <main>
        <div className="topline">
          <span>YOUR DAILY PRACTICE</span>
          <span className="device-status" role="status">
            {syncText}
          </span>
        </div>
        {store.error && (
          <div className="error-message" role="alert">
            {store.error}
            <button className="text-button" onClick={store.retry}>
              Retry
            </button>
          </div>
        )}
        {store.sync === "loading" ? (
          <div className="loading-screen">
            <div className="skeleton" />
            <div className="skeleton" />
            <div className="skeleton" />
          </div>
        ) : !data.settings.onboarded ? (
          <ChooseHabits
            today={today}
            onSave={begin}
            onCustom={() => {
              begin([]);
              setEditor("new");
            }}
          />
        ) : (
          <>
            <header className="page-heading">
              <div>
                <p className="eyebrow">
                  {formatDate(today, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  }).toUpperCase()}
                </p>
                <h1>
                  {page === "today"
                    ? "Today"
                    : page === "history"
                      ? "Your history"
                      : "Your space"}
                  <span className="title-dot">.</span>
                </h1>
                <p className="subtitle">
                  {page === "today"
                    ? "A fresh square. A little progress."
                    : page === "history"
                      ? "Small steps, seen together."
                      : "A few things to make this feel like you."}
                </p>
              </div>
              <button
                className="add-button"
                aria-label="Add habit"
                onClick={() => setEditor("new")}
              >
                <Plus size={20} />
                <span>Add habit</span>
              </button>
            </header>
            {page === "today" ? (
              <Today
                data={data}
                today={today}
                onEntry={(habit, date) => setEntryTarget({ habit, date })}
                onCheck={check}
                onHistory={() => navigate("history")}
                onAdd={() => setEditor("new")}
                onDismissInstall={() =>
                  store.saveSettings({
                    ...data.settings,
                    installDismissed: true,
                  })
                }
                onInstall={() => setInfo("install")}
                onYesterday={() => navigate("history")}
              />
            ) : page === "history" ? (
              <History
                watchHistory={store.watchHistory}
                data={data}
                today={today}
                onEntry={(habit, date) => setEntryTarget({ habit, date })}
                onEdit={setEditor}
                onAdd={() => setEditor("new")}
              />
            ) : (
              <Settings
                data={data}
                user={store.user}
                onHabits={store.saveHabits}
                onSettings={store.saveSettings}
                onImport={store.replaceData}
                onEdit={setEditor}
                onAdd={() => setEditor("new")}
                onInstall={() => setInfo("install")}
                pending={
                  store.sync === "pending" ||
                  store.sync === "error" ||
                  store.sync === "offline"
                }
              />
            )}
          </>
        )}
        <footer className="page-footer">
          <span>Little by little adds up.</span>
          <span>habit-grid / YOUR OWN PACE</span>
        </footer>
      </main>
      {navigation(true)}
      {entryTarget && (
        <EntrySheet
          habit={entryTarget.habit}
          date={entryTarget.date}
          entry={data.entries[entryId(entryTarget.habit.id, entryTarget.date)]}
          onClose={() => setEntryTarget(null)}
          onSave={(status, value) =>
            save(entryTarget.habit, entryTarget.date, status, value)
          }
          onEdit={() => {
            setEditor(entryTarget.habit);
            setEntryTarget(null);
          }}
        />
      )}
      {editor && (
        <HabitEditor
          habit={editor === "new" ? undefined : editor}
          today={today}
          order={data.habits.length}
          onClose={() => setEditor(null)}
          onSave={(habit) => {
            store.saveHabits(
              [...data.habits.filter((h) => h.id !== habit.id), habit].sort(
                (a, b) => a.order - b.order,
              ),
            );
            setEditor(null);
          }}
          onArchive={(habit) => {
            store.saveHabits(
              data.habits.map((h) =>
                h.id === habit.id ? { ...h, archivedOn: today } : h,
              ),
            );
            setEditor(null);
          }}
        />
      )}
      {info && (
        <Sheet
          title="A place on your home screen"
          onClose={() => setInfo(null)}
        >
          <ol className="install-steps">
            <li>
              Open habit-grid in <strong>Safari</strong> on your iPhone.
            </li>
            <li>
              Tap the <strong>Share</strong> button.
            </li>
            <li>
              Choose <strong>Add to Home Screen</strong>.
            </li>
            <li>
              Keep <strong>Open as Web App</strong> enabled if shown, then tap{" "}
              <strong>Add</strong>.
            </li>
          </ol>
          <p className="help-text">
            After your first online visit, you can check in offline. Cloud
            changes sync when you reconnect.
          </p>
          <button className="primary-button" onClick={() => setInfo(null)}>
            Got it
          </button>
        </Sheet>
      )}
      {undo && (
        <div className="toast" role="status">
          <span>{undo.message}</span>
          <button
            onClick={() => {
              try {
                store.saveEntry({
                  ...undo.previous,
                  updatedAt: new Date().toISOString(),
                });
                setUndo(null);
              } catch {
                /* Store exposes errors. */
              }
            }}
          >
            Undo
          </button>
        </div>
      )}
    </div>
  );
}
