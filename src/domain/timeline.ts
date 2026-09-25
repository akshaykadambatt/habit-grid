import { addDays } from "./model";

export const FIRST_HISTORY_DATE = "2000-01-01";
export function daysBetween(start: string, end: string) {
  return Math.round(
    (Date.parse(end + "T12:00:00Z") - Date.parse(start + "T12:00:00Z")) /
      86400000,
  );
}
export function timelineStart(today: string, dates: string[]) {
  const start = [addDays(today, -180), ...dates].reduce((a, b) =>
    a < b ? a : b,
  );
  return start < FIRST_HISTORY_DATE ? FIRST_HISTORY_DATE : start;
}
export function dateWindow(
  count: number,
  left: number,
  width: number,
  labelWidth: number,
  dayWidth: number,
) {
  const first = Math.min(count - 1, Math.max(0, Math.floor(left / dayWidth)));
  const last = Math.min(
    count - 1,
    Math.max(
      first,
      Math.ceil((left + Math.max(dayWidth, width - labelWidth)) / dayWidth) - 1,
    ),
  );
  return {
    first,
    last,
    from: Math.max(0, first - 7),
    to: Math.min(count - 1, last + 7),
  };
}
