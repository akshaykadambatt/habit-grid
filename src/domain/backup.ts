import { COLORS, entryId, localDate, addDays, type Data } from "./model";
function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
function date(value: unknown): value is string {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    value < "2000-01-01" ||
    value > "2100-12-31"
  )
    return false;
  const parsed = new Date(value + "T12:00:00Z");
  return (
    Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}
function number(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 1000000
  );
}
function text(value: unknown, max: number): value is string {
  return (
    typeof value === "string" && value.trim().length > 0 && value.length <= max
  );
}
function keys(value: Record<string, unknown>, expected: string[]) {
  return (
    Object.keys(value).length === expected.length &&
    expected.every((key) => Object.hasOwn(value, key))
  );
}
export function parseBackup(raw: string): Data {
  assert(
    raw.length <= 10_000_000,
    "This backup is too large. Maximum size is 10 MB.",
  );
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error("This is not a valid JSON backup.");
  }
  assert(
    record(value) &&
      keys(value, ["version", "habits", "entries", "settings"]) &&
      value.version === 1,
    "This backup format is not supported.",
  );
  const s = value.settings;
  assert(
    record(s) &&
      keys(s, [
        "version",
        "timezone",
        "onboarded",
        "installDismissed",
        "lastBackup",
      ]) &&
      s.version === 1 &&
      typeof s.onboarded === "boolean" &&
      typeof s.installDismissed === "boolean" &&
      text(s.timezone, 100) &&
      (s.lastBackup === null ||
        (typeof s.lastBackup === "string" &&
          Number.isFinite(Date.parse(s.lastBackup)))),
    "The backup settings are invalid.",
  );
  try {
    localDate(s.timezone);
  } catch {
    throw new Error("The backup timezone is invalid.");
  }
  assert(
    Array.isArray(value.habits) && value.habits.length <= 200,
    "A backup may contain up to 200 habits.",
  );
  const ids = new Set<string>();
  for (const h of value.habits) {
    assert(
      record(h) &&
        keys(h, [
          "id",
          "name",
          "color",
          "icon",
          "order",
          "createdOn",
          "archivedOn",
          "rules",
        ]),
      "A habit record is invalid.",
    );
    assert(
      typeof h.id === "string" &&
        /^[a-zA-Z0-9-]{1,64}$/.test(h.id) &&
        !ids.has(h.id),
      "Habit IDs must be unique.",
    );
    ids.add(h.id);
    assert(
      text(h.name, 100) &&
        COLORS.includes(h.color as (typeof COLORS)[number]) &&
        ["workout", "food", "sleep", "leaf", "habit"].includes(
          h.icon as string,
        ) &&
        number(h.order) &&
        date(h.createdOn) &&
        (h.archivedOn === null ||
          (date(h.archivedOn) && h.archivedOn >= h.createdOn)),
      "A habit has invalid fields.",
    );
    assert(
      Array.isArray(h.rules) && h.rules.length > 0 && h.rules.length <= 500,
      "A habit has invalid rule history.",
    );
    let last = "";
    for (const r of h.rules) {
      assert(
        record(r) &&
          keys(r, [
            "from",
            "kind",
            "days",
            "unit",
            "comparison",
            "target",
            "upper",
          ]) &&
          date(r.from) &&
          r.from >= h.createdOn &&
          r.from > last &&
          ["checkbox", "number"].includes(r.kind as string) &&
          ["min", "max", "range"].includes(r.comparison as string) &&
          typeof r.unit === "string" &&
          r.unit.length <= 24 &&
          number(r.target) &&
          number(r.upper),
        "A habit rule is invalid.",
      );
      assert(
        Array.isArray(r.days) &&
          r.days.length > 0 &&
          r.days.length <= 7 &&
          new Set(r.days).size === r.days.length &&
          r.days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6),
        "A habit schedule is invalid.",
      );
      assert(
        r.kind !== "number" ||
          (r.unit.trim().length > 0 &&
            (r.comparison !== "range" || r.upper >= r.target)),
        "A numeric target is invalid.",
      );
      last = r.from;
    }
    assert(
      h.rules[0].from === h.createdOn,
      "A habit must have rules from its creation date.",
    );
  }
  assert(
    record(value.entries) && Object.keys(value.entries).length <= 50000,
    "The backup has too many or invalid entries.",
  );
  const today = localDate(s.timezone);
  for (const [id, e] of Object.entries(value.entries)) {
    assert(
      record(e) &&
        keys(e, ["habitId", "date", "status", "value", "updatedAt"]) &&
        typeof e.habitId === "string" &&
        ids.has(e.habitId) &&
        date(e.date) &&
        e.date <= addDays(today, 1) &&
        id === entryId(e.habitId, e.date) &&
        ["met", "not-met", "unlogged"].includes(e.status as string) &&
        (e.value === null || number(e.value)) &&
        typeof e.updatedAt === "string" &&
        Number.isFinite(Date.parse(e.updatedAt)),
      "An entry is invalid or belongs to an unknown habit.",
    );
  }
  return value as unknown as Data;
}
export function exportBackup(data: Data) {
  return JSON.stringify(data, null, 2);
}
