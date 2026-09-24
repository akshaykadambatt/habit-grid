export const COLORS = [
  "mint",
  "lavender",
  "sky",
  "peach",
  "yellow",
  "rose",
] as const;
export type Color = (typeof COLORS)[number];
export type Rule = {
  from: string;
  kind: "checkbox" | "number";
  days: number[];
  unit: string;
  comparison: "min" | "max" | "range";
  target: number;
  upper: number;
};
export type Habit = {
  id: string;
  name: string;
  color: Color;
  icon: "workout" | "food" | "sleep" | "leaf" | "habit";
  order: number;
  createdOn: string;
  archivedOn: string | null;
  rules: Rule[];
};
export type Entry = {
  habitId: string;
  date: string;
  status: "met" | "not-met" | "unlogged";
  value: number | null;
  updatedAt: string;
};
export type Settings = {
  version: 1;
  timezone: string;
  onboarded: boolean;
  installDismissed: boolean;
  lastBackup: string | null;
};
export type Data = {
  version: 1;
  habits: Habit[];
  entries: Record<string, Entry>;
  settings: Settings;
};
export type DayState =
  | "met"
  | "not-met"
  | "unlogged"
  | "unscheduled"
  | "future";

export function localDate(timezone: string, now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  return ["year", "month", "day"]
    .map((type) => parts.find((p) => p.type === type)!.value)
    .join("-");
}
export function addDays(date: string, amount: number) {
  const d = new Date(date + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + amount);
  return d.toISOString().slice(0, 10);
}
export function weekday(date: string) {
  return new Date(date + "T12:00:00Z").getUTCDay();
}
export function formatDate(
  date: string,
  options: Intl.DateTimeFormatOptions = { month: "long", day: "numeric" },
) {
  return new Date(date + "T12:00:00Z").toLocaleDateString("en-US", {
    ...options,
    timeZone: "UTC",
  });
}
export function entryId(habitId: string, date: string) {
  return `${habitId}_${date}`;
}
export function ruleOn(habit: Habit, date: string): Rule | undefined {
  return [...habit.rules].reverse().find((r) => r.from <= date);
}
export function isScheduled(habit: Habit, date: string) {
  return (
    date >= habit.createdOn &&
    (!habit.archivedOn || date < habit.archivedOn) &&
    !!ruleOn(habit, date)?.days.includes(weekday(date))
  );
}
export function meetsTarget(rule: Rule, value: number) {
  return (
    Number.isFinite(value) &&
    (rule.comparison === "min"
      ? value >= rule.target
      : rule.comparison === "max"
        ? value <= rule.target
        : value >= rule.target && value <= rule.upper)
  );
}
export function dayState(
  habit: Habit,
  date: string,
  entries: Data["entries"],
  today: string,
): DayState {
  if (date > today) return "future";
  if (!isScheduled(habit, date)) return "unscheduled";
  const entry = entries[entryId(habit.id, date)];
  if (!entry || entry.status === "unlogged") return "unlogged";
  const rule = ruleOn(habit, date)!;
  return rule.kind === "number"
    ? entry.value === null
      ? "unlogged"
      : meetsTarget(rule, entry.value)
        ? "met"
        : "not-met"
    : entry.status;
}
export function targetLabel(rule: Rule) {
  return rule.kind === "checkbox"
    ? "Not logged today"
    : `Goal: ${rule.comparison === "min" ? "at least " : rule.comparison === "max" ? "at most " : ""}${rule.target}${rule.comparison === "range" ? `–${rule.upper}` : ""} ${rule.unit}`;
}
export function reviseHabit(habit: Habit, rule: Rule, today: string): Habit {
  return {
    ...habit,
    rules: [
      ...habit.rules.filter((r) => r.from < today),
      { ...rule, from: today },
    ],
  };
}
export function streaks(habit: Habit, entries: Data["entries"], today: string) {
  let current = 0,
    best = 0,
    run = 0;
  for (let date = habit.createdOn; date <= today; date = addDays(date, 1)) {
    if (!isScheduled(habit, date)) continue;
    const state = dayState(habit, date, entries, today);
    if (state === "met") {
      run++;
      best = Math.max(best, run);
    } else if (date !== today || state === "not-met") run = 0;
  }
  current = run;
  return { current, best };
}
export function weekStart(date: string) {
  return addDays(date, -((weekday(date) + 6) % 7));
}
export function review(
  habits: Habit[],
  entries: Data["entries"],
  start: string,
  end: string,
  today: string,
) {
  const rows = habits
    .map((habit) => {
      let met = 0,
        missed = 0,
        unlogged = 0;
      for (
        let date = start;
        date <= end && date <= today;
        date = addDays(date, 1)
      ) {
        const state = dayState(habit, date, entries, today);
        if (state === "met") met++;
        else if (state === "not-met") missed++;
        else if (state === "unlogged") unlogged++;
      }
      return {
        habit,
        met,
        missed,
        unlogged,
        total: met + missed + unlogged,
        ...streaks(habit, entries, today),
      };
    })
    .filter((row) => row.total > 0);
  return {
    rows,
    met: rows.reduce((a, r) => a + r.met, 0),
    missed: rows.reduce((a, r) => a + r.missed, 0),
    unlogged: rows.reduce((a, r) => a + r.unlogged, 0),
    total: rows.reduce((a, r) => a + r.total, 0),
  };
}
export function emptyData(
  timezone = Intl.DateTimeFormat().resolvedOptions().timeZone,
): Data {
  return {
    version: 1,
    habits: [],
    entries: {},
    settings: {
      version: 1,
      timezone,
      onboarded: false,
      installDismissed: false,
      lastBackup: null,
    },
  };
}
export function starterHabits(today: string): Habit[] {
  return [
    { name: "Workout", color: "mint", icon: "workout" },
    { name: "No fast food", color: "peach", icon: "food" },
    { name: "Sleep", color: "lavender", icon: "sleep" },
    { name: "Healthy calories", color: "yellow", icon: "leaf" },
  ].map(
    (h, index) =>
      ({
        ...h,
        id: crypto.randomUUID(),
        order: index,
        createdOn: today,
        archivedOn: null,
        rules: [
          {
            from: today,
            kind: index === 2 ? "number" : "checkbox",
            days: [0, 1, 2, 3, 4, 5, 6],
            unit: index === 2 ? "hours" : "",
            comparison: "min",
            target: index === 2 ? 9 : 1,
            upper: index === 2 ? 9 : 1,
          },
        ],
      }) as Habit,
  );
}
