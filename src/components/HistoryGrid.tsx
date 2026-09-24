import { Check, Minus, Plus } from "lucide-react";
import { useEffect, useRef } from "react";

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
type GridRow = {
  id: string;
  name: string;
  color: string;
  current: number;
  states: CellState[];
  backfillDates?: string[];
};
export function HistoryGrid({
  rows,
  days,
  today,
  onCell,
}: {
  rows: GridRow[];
  days: string[];
  today: string;
  onCell: (id: string, date: string) => void;
}) {
  const scroll = useRef<HTMLDivElement>(null);
  const lastDate = days.at(-1);
  useEffect(() => {
    const element = scroll.current;
    if (element) element.scrollLeft = element.scrollWidth - element.clientWidth;
  }, [lastDate, days.length]);
  return (
    <>
      <div
        ref={scroll}
        className="grid-scroll"
        tabIndex={0}
        role="region"
        aria-label="Habit history. Scroll horizontally for more dates."
      >
        <table className="history-table">
          <thead>
            <tr>
              <th scope="col">YOUR HABITS</th>
              {days.map((date) => (
                <th
                  scope="col"
                  key={date}
                  className={date === today ? "today-column" : ""}
                >
                  <span>
                    {new Date(date + "T12:00:00Z").toLocaleDateString("en", {
                      weekday: "short",
                      timeZone: "UTC",
                    })}
                  </span>
                  <strong>{Number(date.slice(-2))}</strong>
                </th>
              ))}
              <th scope="col" className="streak-column">
                STREAK
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className={row.color}>
                <th scope="row">
                  <span className="color-dot" />
                  {row.name}
                </th>
                {days.map((date, index) => (
                  <td
                    key={date}
                    className={date === today ? "today-column" : ""}
                  >
                    <button
                      className={`grid-cell ${row.backfillDates?.includes(date) ? "state-before-start" : `state-${row.states[index]}`}`}
                      disabled={
                        row.states[index] === "future" ||
                        (row.states[index] === "unscheduled" &&
                          !row.backfillDates?.includes(date))
                      }
                      aria-label={`${row.name}, ${date}, ${row.backfillDates?.includes(date) ? "Log earlier day" : stateLabels[row.states[index]]}`}
                      onClick={() => onCell(row.id, date)}
                    >
                      {row.backfillDates?.includes(date) ? (
                        <Plus size={16} aria-hidden="true" />
                      ) : (
                        <StateMark state={row.states[index]} />
                      )}
                    </button>
                  </td>
                ))}
                <td className="streak-column">
                  <span className="streak-number">{row.current}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.some((row) => row.backfillDates?.length) && (
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
