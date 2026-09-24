import { useState } from "react";
import { ArrowRight, Check, Cloud, MonitorSmartphone } from "lucide-react";
import { login, configured } from "../data/firebase";
import { starterHabits, type Habit } from "../domain/model";
import { HabitIcon } from "../components/HabitRow";
export function Welcome({
  onLocal,
  initialError = "",
}: {
  onLocal: () => void;
  initialError?: string;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function connect() {
    setBusy(true);
    setError("");
    try {
      await login();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Sign-in did not complete. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="welcome-shell">
      <a className="brand" href="/">
        <img src="/favicon.svg" alt="" />
        habit-grid
      </a>
      <div className="welcome-card">
        <div className="welcome-preview" aria-hidden="true">
          {Array.from({ length: 28 }, (_, i) => (
            <i
              key={i}
              className={
                ["mint", "lavender", "peach", "yellow"][Math.floor(i / 7)]
              }
              style={{ opacity: i % 7 === 6 ? 0.3 : 1 }}
            />
          ))}
        </div>
        <p className="eyebrow">A LITTLE, EVERY DAY</p>
        <h1>
          Your habits.
          <br />A clearer picture.
        </h1>
        <p className="welcome-copy">
          Make time for what matters. Check in quickly.
          <br />
          See your small steps add up.
        </p>
        <button
          className="primary-button"
          onClick={connect}
          disabled={busy || !configured}
        >
          <Cloud size={19} />
          {busy ? "Opening Google…" : "Continue with Google"}
          <ArrowRight size={18} />
        </button>
        <button className="local-button" onClick={onLocal}>
          <MonitorSmartphone size={17} />
          Use this device only
        </button>
        {(error || (!busy && initialError)) && (
          <p className="error-message" role="alert">
            {error || initialError}
          </p>
        )}
        <p className="welcome-footnote">
          Your habits stay private. Google sign-in keeps
          <br />
          your progress in sync across devices.
        </p>
      </div>
      <p className="welcome-bottom">Small steps. Your own pace.</p>
    </div>
  );
}
export function ChooseHabits({
  today,
  onSave,
  onCustom,
}: {
  today: string;
  onSave: (habits: Habit[]) => void;
  onCustom: () => void;
}) {
  const [suggested] = useState(() => starterHabits(today));
  const [selected, setSelected] = useState(() => suggested.map((h) => h.id));
  return (
    <div className="setup-card">
      <p className="eyebrow">MAKE IT YOURS</p>
      <h1>Start small.</h1>
      <p className="subtitle">
        A few ideas for your daily practice. You can change any of these later.
      </p>
      <div className="starter-list">
        {suggested.map((h) => (
          <button
            className={`starter-choice ${h.color}`}
            aria-pressed={selected.includes(h.id)}
            key={h.id}
            onClick={() =>
              setSelected((old) =>
                old.includes(h.id)
                  ? old.filter((id) => id !== h.id)
                  : [...old, h.id],
              )
            }
          >
            <span className="habit-icon">
              <HabitIcon habit={h} />
            </span>
            <span>
              <strong>{h.name}</strong>
              <small>
                {h.icon === "sleep"
                  ? "At least 9 hours"
                  : h.icon === "leaf"
                    ? "Your 2000-calorie goal"
                    : "Daily check-in"}
              </small>
            </span>
            <span
              className={`starter-check ${selected.includes(h.id) ? "selected" : ""}`}
            >
              {selected.includes(h.id) && <Check size={18} />}
            </span>
          </button>
        ))}
      </div>
      <button
        className="primary-button"
        onClick={() => onSave(suggested.filter((h) => selected.includes(h.id)))}
      >
        Start with {selected.length}{" "}
        {selected.length === 1 ? "habit" : "habits"}
        <ArrowRight size={18} />
      </button>
      <button className="local-button" onClick={onCustom}>
        Create my own habit
      </button>
      <p className="help-text">
        These are your personal goals, and all targets are editable.
      </p>
    </div>
  );
}
