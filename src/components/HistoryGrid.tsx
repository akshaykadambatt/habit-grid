import { Check, Minus, Plus } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  addDays,
  canBackfill,
  dayState,
  formatDate,
  type Data,
  type Habit,
} from "../domain/model";
import {
  dateWindow,
  daysBetween,
  FIRST_HISTORY_DATE,
  timelineStart,
} from "../domain/timeline";

export type CellState =
  | "met"
  | "not-met"
  | "unlogged"
  | "unscheduled"
  | "future";
export const stateLabels: Record<CellState, string> = {
  met: "Met",
  "not-met": "Not met",
  unlogged: "Not logged",
  unscheduled: "Not scheduled",
  future: "Future",
};
export function StateMark({ state }: { state: CellState }) {
  return state === "met" ? (
    <Check size={16} aria-hidden="true" />
  ) : state === "not-met" ? (
    <Minus size={16} aria-hidden="true" />
  ) : state === "unscheduled" ? (
    <span aria-hidden="true">/</span>
  ) : null;
}
type Viewport = { left: number; width: number; label: number; day: number };
export function HistoryGrid({
  habits,
  entries,
  today,
  compact,
  focusDate,
  onRange,
  onCell,
}: {
  habits: Habit[];
  entries: Data["entries"];
  today: string;
  compact: boolean;
  focusDate: { date: string; request: number } | null;
  onRange: (start: string, end: string) => void;
  onCell: (habit: Habit, date: string) => void;
}) {
  const scroll = useRef<HTMLDivElement>(null);
  const earliest = timelineStart(
    today,
    habits.map((h) => h.createdOn),
  );
  const [start, setStart] = useState(earliest);
  const [viewport, setViewport] = useState<Viewport>({
    left: 0,
    width: 0,
    label: 112,
    day: 56,
  });
  const layout = useRef<(Viewport & { start: string }) | null>(null);
  const frame = useRef(0);
  const appliedFocus = useRef<number | null>(null);
  const count = daysBetween(start, today) + 1;
  const window = dateWindow(
    count,
    viewport.left,
    viewport.width,
    viewport.label,
    viewport.day,
  );
  const days = Array.from({ length: window.to - window.from + 1 }, (_, i) =>
    addDays(start, window.from + i),
  );
  const visibleStart = addDays(start, window.first);
  const visibleEnd = addDays(start, window.last);
  useEffect(
    () => onRange(visibleStart, visibleEnd),
    [visibleStart, visibleEnd, onRange],
  );
  useEffect(() => {
    if (earliest < start) setStart(earliest);
  }, [earliest, start]);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  // Keep the rightmost visible date in place on resize, density changes, and prepends.
  useLayoutEffect(() => {
    const element = scroll.current!;
    const measure = () => {
      const style = getComputedStyle(element);
      const day = parseFloat(style.getPropertyValue("--history-day-width"));
      const label = parseFloat(style.getPropertyValue("--history-label-width"));
      const width = element.clientWidth;
      const previous = layout.current;
      const anchor = previous
        ? daysBetween(start, previous.start) +
          (previous.left + previous.width - previous.label) / previous.day
        : count;
      element.scrollLeft = Math.max(0, anchor * day - width + label);
      const next = { left: element.scrollLeft, width, day, label, start };
      layout.current = next;
      setViewport(next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [start, compact, count]);

  useEffect(() => {
    if (!focusDate || appliedFocus.current === focusDate.request) return;
    const date =
      focusDate.date < FIRST_HISTORY_DATE
        ? FIRST_HISTORY_DATE
        : focusDate.date > today
          ? today
          : focusDate.date;
    if (date < addDays(start, 14) && start > FIRST_HISTORY_DATE) {
      setStart(
        addDays(date, -30) < FIRST_HISTORY_DATE
          ? FIRST_HISTORY_DATE
          : addDays(date, -30),
      );
      return;
    }
    const element = scroll.current!;
    const dimensions = layout.current!;
    appliedFocus.current = focusDate.request;
    element.scrollTo({
      left:
        (daysBetween(start, date) + 1) * dimensions.day -
        dimensions.width +
        dimensions.label,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }, [focusDate, start, today]);

  function trackScroll() {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const element = scroll.current;
      if (!element || !layout.current) return;
      // Resizing can clamp scrollLeft before ResizeObserver runs. Preserve the
      // previous geometry until the observer has restored the date anchor.
      if (element.clientWidth !== layout.current.width) return;
      const next = { ...layout.current, left: element.scrollLeft };
      layout.current = next;
      setViewport(next);
      if (next.left < next.day * 7 && start > FIRST_HISTORY_DATE) {
        setStart(
          addDays(start, -180) < FIRST_HISTORY_DATE
            ? FIRST_HISTORY_DATE
            : addDays(start, -180),
        );
      }
    });
  }
  const before = window.from * viewport.day;
  const after = (count - window.to - 1) * viewport.day;
  return (
    <>
      <div
        ref={scroll}
        className={`grid-scroll${compact ? " grid-compact" : ""}`}
        onScroll={trackScroll}
        tabIndex={0}
        role="region"
        aria-label="Habit history. Scroll horizontally for more dates."
      >
        <table
          className="history-table"
          aria-label="Habit history"
          aria-colcount={count + 1}
          style={{
            width: `calc(var(--history-label-width) + ${count} * var(--history-day-width))`,
          }}
        >
          <colgroup>
            <col style={{ width: "var(--history-label-width)" }} />
            {before > 0 && (
              <col
                style={{
                  width: `calc(${window.from} * var(--history-day-width))`,
                }}
              />
            )}
            {days.map((date) => (
              <col key={date} style={{ width: "var(--history-day-width)" }} />
            ))}
            {after > 0 && (
              <col
                style={{
                  width: `calc(${count - window.to - 1} * var(--history-day-width))`,
                }}
              />
            )}
          </colgroup>
          <thead>
            <tr>
              <th scope="col" aria-colindex={1}>
                YOUR HABITS
              </th>
              {before > 0 && (
                <th className="timeline-spacer" aria-hidden="true" />
              )}
              {days.map((date, i) => (
                <th
                  scope="col"
                  key={date}
                  aria-colindex={window.from + i + 2}
                  className={date === today ? "today-column" : ""}
                  aria-label={formatDate(date, { dateStyle: "full" })}
                >
                  <small>{formatDate(date, { month: "short" })}</small>
                  <span>{formatDate(date, { weekday: "short" })}</span>
                  <strong>{Number(date.slice(-2))}</strong>
                </th>
              ))}
              {after > 0 && (
                <th className="timeline-spacer" aria-hidden="true" />
              )}
            </tr>
          </thead>
          <tbody>
            {habits.map((habit) => (
              <tr key={habit.id} className={habit.color}>
                <th scope="row" aria-colindex={1}>
                  <span className="color-dot" />
                  {habit.name}
                </th>
                {before > 0 && (
                  <td className="timeline-spacer" aria-hidden="true" />
                )}
                {days.map((date, i) => {
                  const state = dayState(habit, date, entries, today);
                  const backfill = canBackfill(habit, date, today);
                  return (
                    <td
                      key={date}
                      aria-colindex={window.from + i + 2}
                      className={date === today ? "today-column" : ""}
                    >
                      <button
                        className={`grid-cell ${backfill ? "state-before-start" : `state-${state}`}`}
                        disabled={
                          state === "future" ||
                          (state === "unscheduled" && !backfill)
                        }
                        aria-label={`${habit.name}, ${date}, ${backfill ? "Log earlier day" : stateLabels[state]}`}
                        onClick={() => onCell(habit, date)}
                      >
                        {backfill ? (
                          <Plus size={16} aria-hidden="true" />
                        ) : (
                          <StateMark state={state} />
                        )}
                      </button>
                    </td>
                  );
                })}
                {after > 0 && (
                  <td className="timeline-spacer" aria-hidden="true" />
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {habits.some((h) => days.some((d) => canBackfill(h, d, today))) && (
        <p className="help-text">
          Tap a + to log a day before you started tracking.
        </p>
      )}
      <div className="grid-legend">
        {(["met", "not-met", "unlogged", "unscheduled"] as const).map(
          (state) => (
            <span key={state}>
              <i className={`legend-square state-${state}`}>
                <StateMark state={state} />
              </i>
              {stateLabels[state]}
            </span>
          ),
        )}
      </div>
    </>
  );
}
