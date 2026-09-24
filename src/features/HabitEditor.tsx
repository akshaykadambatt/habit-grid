import { useState } from "react";
import { Check, Archive } from "lucide-react";
import { Sheet } from "../components/Sheet";
import { HabitIcon } from "../components/HabitRow";
import {
  COLORS,
  reviseHabit,
  ruleOn,
  type Habit,
  type Rule,
  type Color,
} from "../domain/model";
export function HabitEditor({
  habit,
  today,
  order,
  onClose,
  onSave,
  onArchive,
}: {
  habit?: Habit;
  today: string;
  order: number;
  onClose: () => void;
  onSave: (habit: Habit) => void;
  onArchive: (habit: Habit) => void;
}) {
  const initial = habit ? ruleOn(habit, today) || habit.rules.at(-1)! : null;
  const [name, setName] = useState(habit?.name || "");
  const [kind, setKind] = useState<Rule["kind"]>(initial?.kind || "checkbox");
  const [unit, setUnit] = useState(initial?.unit || "");
  const [comparison, setComparison] = useState<Rule["comparison"]>(
    initial?.comparison || "min",
  );
  const [target, setTarget] = useState(String(initial?.target || ""));
  const [upper, setUpper] = useState(String(initial?.upper || ""));
  const [days, setDays] = useState(initial?.days || [0, 1, 2, 3, 4, 5, 6]);
  const [color, setColor] = useState<Color>(habit?.color || "mint");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [archive, setArchive] = useState(false);
  function submit() {
    const next: Record<string, string> = {};
    const numeric = Number(target);
    const high = Number(upper);
    if (!name.trim() || name.trim().length > 100)
      next.name = "Use a name between 1 and 100 characters.";
    if (!days.length) next.days = "Choose at least one day.";
    if (kind === "number" && (!unit.trim() || unit.length > 24))
      next.unit = "Add a short unit, such as hours or minutes.";
    if (
      kind === "number" &&
      (!target.trim() ||
        !Number.isFinite(numeric) ||
        numeric < 0 ||
        numeric > 1000000)
    )
      next.target = "Enter a target from 0 to 1,000,000.";
    if (
      kind === "number" &&
      comparison === "range" &&
      (!upper.trim() ||
        !Number.isFinite(high) ||
        high < numeric ||
        high > 1000000)
    )
      next.upper = "The upper target must be at least the lower target.";
    setErrors(next);
    if (Object.keys(next).length) return;
    const rule: Rule = {
      from: today,
      kind,
      unit: kind === "number" ? unit.trim() : "",
      comparison,
      target: kind === "number" ? numeric : 1,
      upper:
        kind === "number" && comparison === "range"
          ? high
          : kind === "number"
            ? numeric
            : 1,
      days: [...days].sort(),
    };
    const result: Habit = habit
      ? { ...reviseHabit(habit, rule, today), name: name.trim(), color }
      : {
          id: crypto.randomUUID(),
          name: name.trim(),
          color,
          icon: "habit",
          order,
          createdOn: today,
          archivedOn: null,
          rules: [rule],
        };
    try {
      onSave(result);
    } catch (e) {
      setErrors({
        save:
          e instanceof Error ? e.message : "Could not save. Please try again.",
      });
    }
  }
  if (archive && habit)
    return (
      <Sheet title="Archive this habit?" onClose={() => setArchive(false)}>
        <p className="help-text">
          “{habit.name}” will leave Today. All earlier history stays in your
          grid. Archiving starts today.
        </p>
        <div className="sheet-actions">
          <button
            className="secondary-button"
            onClick={() => setArchive(false)}
          >
            Keep habit
          </button>
          <button className="danger-button" onClick={() => onArchive(habit)}>
            Archive habit
          </button>
        </div>
      </Sheet>
    );
  return (
    <Sheet
      wide
      title={habit ? "Edit habit" : "A new daily practice"}
      subtitle={
        habit
          ? "Schedule and target changes start today. Earlier days keep their original rules."
          : "Start with something small and specific."
      }
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        noValidate
      >
        <label className="field">
          <span>Habit name</span>
          <input
            autoFocus
            value={name}
            maxLength={100}
            placeholder="e.g. Read a few pages"
            onChange={(e) => setName(e.target.value)}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
          />
          {errors.name && (
            <span className="field-error" id="name-error">
              {errors.name}
            </span>
          )}
        </label>
        <fieldset className="field">
          <legend>How will you track it?</legend>
          <div className="segmented">
            <button
              type="button"
              aria-pressed={kind === "checkbox"}
              className={kind === "checkbox" ? "selected" : ""}
              onClick={() => setKind("checkbox")}
            >
              Checkbox
            </button>
            <button
              type="button"
              aria-pressed={kind === "number"}
              className={kind === "number" ? "selected" : ""}
              onClick={() => setKind("number")}
            >
              Number
            </button>
          </div>
        </fieldset>
        {kind === "number" && (
          <>
            <label className="field">
              <span>Unit</span>
              <input
                value={unit}
                maxLength={24}
                placeholder="hours, pages, minutes…"
                onChange={(e) => setUnit(e.target.value)}
              />
              {errors.unit && (
                <span className="field-error">{errors.unit}</span>
              )}
            </label>
            <label className="field">
              <span>Target rule</span>
              <select
                value={comparison}
                onChange={(e) =>
                  setComparison(e.target.value as Rule["comparison"])
                }
              >
                <option value="min">At least</option>
                <option value="max">At most</option>
                <option value="range">Within a range</option>
              </select>
            </label>
            <div className="target-fields">
              <label className="field">
                <span>{comparison === "range" ? "Minimum" : "Target"}</span>
                <input
                  inputMode="decimal"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                />
                {errors.target && (
                  <span className="field-error">{errors.target}</span>
                )}
              </label>
              {comparison === "range" && (
                <label className="field">
                  <span>Maximum</span>
                  <input
                    inputMode="decimal"
                    value={upper}
                    onChange={(e) => setUpper(e.target.value)}
                  />
                  {errors.upper && (
                    <span className="field-error">{errors.upper}</span>
                  )}
                </label>
              )}
            </div>
          </>
        )}
        <fieldset className="field">
          <legend>When?</legend>
          <div className="schedule-heading">
            <span>{days.length === 7 ? "Every day" : "Selected weekdays"}</span>
            <button
              type="button"
              onClick={() => setDays([0, 1, 2, 3, 4, 5, 6])}
            >
              Every day
            </button>
          </div>
          <div className="weekday-picker">
            {[
              { n: 1, s: "M", name: "Monday" },
              { n: 2, s: "T", name: "Tuesday" },
              { n: 3, s: "W", name: "Wednesday" },
              { n: 4, s: "T", name: "Thursday" },
              { n: 5, s: "F", name: "Friday" },
              { n: 6, s: "S", name: "Saturday" },
              { n: 0, s: "S", name: "Sunday" },
            ].map((day) => (
              <button
                key={day.n}
                type="button"
                aria-label={day.name}
                aria-pressed={days.includes(day.n)}
                className={days.includes(day.n) ? "selected" : ""}
                onClick={() =>
                  setDays((old) =>
                    old.includes(day.n)
                      ? old.filter((n) => n !== day.n)
                      : [...old, day.n],
                  )
                }
              >
                {day.s}
              </button>
            ))}
          </div>
          {errors.days && <span className="field-error">{errors.days}</span>}
        </fieldset>
        <fieldset className="field">
          <legend>A little color</legend>
          <div className="color-picker">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={c}
                aria-label={c}
                aria-pressed={color === c}
                onClick={() => setColor(c)}
              >
                {color === c && <Check size={20} />}
              </button>
            ))}
          </div>
        </fieldset>
        <div className={`editor-preview ${color}`}>
          <span className="habit-icon">
            <HabitIcon habit={habit || { icon: "habit" }} />
          </span>
          <div>
            <strong>{name.trim() || "Your new habit"}</strong>
            <small>
              {days.length === 7 ? "Every day" : `${days.length} days a week`} ·{" "}
              {kind === "checkbox"
                ? "One quick check-in"
                : `${target || "0"} ${unit || "units"}`}
            </small>
          </div>
        </div>
        {errors.save && (
          <p className="error-message" role="alert">
            {errors.save}
          </p>
        )}
        <div className="sheet-actions">
          <button className="secondary-button" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-button" type="submit">
            Save habit
          </button>
        </div>
        {habit && !habit.archivedOn && (
          <button
            className="archive-link"
            type="button"
            onClick={() => setArchive(true)}
          >
            <Archive size={17} />
            Archive habit
          </button>
        )}
      </form>
    </Sheet>
  );
}
