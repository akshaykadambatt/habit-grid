import { describe, it, expect } from "vitest";
import {
  addDays,
  dayState,
  entryId,
  localDate,
  meetsTarget,
  review,
  reviseHabit,
  starterHabits,
  streaks,
  weekStart,
  backfillHabit,
  canBackfill,
  type Entry,
  type Rule,
} from "../src/domain/model";
const day = "2026-09-21";
const habit = () => starterHabits(day)[0];
const entry = (
  id: string,
  date: string,
  status: Entry["status"] = "met",
  value: number | null = null,
): Entry => ({
  habitId: id,
  date,
  status,
  value,
  updatedAt: new Date().toISOString(),
});
describe("calendar dates", () => {
  it("handles month/year boundaries without DST arithmetic", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-08", 1)).toBe("2026-03-09");
  });
  it("uses the saved timezone at midnight", () => {
    expect(localDate("America/Toronto", new Date("2026-09-24T03:59:00Z"))).toBe(
      "2026-09-23",
    );
    expect(localDate("America/Toronto", new Date("2026-09-24T04:00:00Z"))).toBe(
      "2026-09-24",
    );
  });
  it("starts weeks on Monday", () => expect(weekStart("2026-09-27")).toBe(day));
});
describe("habits and history", () => {
  it("lets a newly created daily habit record yesterday and includes it in review and streaks", () => {
    const original = habit();
    const yesterday = addDays(day, -1);
    expect(canBackfill(original, yesterday, day)).toBe(true);
    const earlier = backfillHabit(original, yesterday, day);
    const entries = {
      [entryId(earlier.id, yesterday)]: entry(earlier.id, yesterday),
    };
    expect(dayState(earlier, yesterday, entries, day)).toBe("met");
    expect(streaks(earlier, entries, day)).toEqual({ current: 1, best: 1 });
    expect(review([earlier], entries, yesterday, day, day)).toMatchObject({
      met: 1,
      unlogged: 1,
      total: 2,
    });
    expect(original.createdOn).toBe(day);
  });
  it("backfills with the original numeric target while preserving later rule changes", () => {
    const original = starterHabits(day)[2];
    const revised = reviseHabit(
      original,
      { ...original.rules[0], target: 10 },
      "2026-09-23",
    );
    const earlier = backfillHabit(revised, "2026-09-20", "2026-09-24");
    expect(earlier.rules[0]).toMatchObject({ from: "2026-09-20", target: 9 });
    expect(earlier.rules[1]).toEqual(revised.rules[1]);
    const entries = {
      [entryId(earlier.id, "2026-09-20")]: entry(
        earlier.id,
        "2026-09-20",
        "met",
        9,
      ),
    };
    expect(dayState(earlier, "2026-09-20", entries, "2026-09-24")).toBe("met");
  });
  it("keeps rest days, future dates, and already tracked days from changing the start date", () => {
    const h = habit();
    h.rules[0].days = [1, 3, 5];
    expect(canBackfill(h, "2026-09-20", day)).toBe(false);
    expect(backfillHabit(h, "2026-09-20", day)).toBe(h);
    expect(backfillHabit(h, "2026-09-22", day)).toBe(h);
    expect(backfillHabit(h, day, day)).toBe(h);
    expect(canBackfill(h, "2026-09-18", day)).toBe(true);
  });
  it("never interprets silence as success", () =>
    expect(dayState(habit(), day, {}, day)).toBe("unlogged"));
  it("marks past rest days and future days distinctly", () => {
    const h = habit();
    h.rules[0].days = [1, 3];
    expect(dayState(h, "2026-09-22", {}, "2026-09-24")).toBe("unscheduled");
    expect(dayState(h, "2026-09-25", {}, "2026-09-24")).toBe("future");
  });
  it("uses effective-dated numeric thresholds", () => {
    const h = starterHabits(day)[2];
    const revised = reviseHabit(h, { ...h.rules[0], target: 10 }, "2026-09-23");
    const entries = {
      [entryId(h.id, day)]: entry(h.id, day, "met", 9),
      [entryId(h.id, "2026-09-23")]: entry(h.id, "2026-09-23", "met", 9),
    };
    expect(dayState(revised, day, entries, "2026-09-24")).toBe("met");
    expect(dayState(revised, "2026-09-23", entries, "2026-09-24")).toBe(
      "not-met",
    );
  });
  it("handles inclusive min, max and range boundaries", () => {
    const r = { comparison: "range", target: 8, upper: 9 } as Rule;
    expect(meetsTarget(r, 8)).toBe(true);
    expect(meetsTarget(r, 9)).toBe(true);
    expect(meetsTarget(r, 9.1)).toBe(false);
    expect(meetsTarget({ ...r, comparison: "max" }, 8)).toBe(true);
    expect(meetsTarget({ ...r, comparison: "min" }, 7.9)).toBe(false);
    expect(meetsTarget(r, NaN)).toBe(false);
  });
  it("keeps rest days neutral and today pending", () => {
    const h = habit();
    h.rules[0].days = [1, 3, 5];
    const entries = {
      [entryId(h.id, day)]: entry(h.id, day),
      [entryId(h.id, "2026-09-23")]: entry(h.id, "2026-09-23"),
    };
    expect(streaks(h, entries, "2026-09-25")).toEqual({ current: 2, best: 2 });
    expect(streaks(h, entries, "2026-09-26")).toEqual({ current: 0, best: 2 });
  });
  it("retains best streak after an explicit failure", () => {
    const h = habit();
    const entries = {
      [entryId(h.id, day)]: entry(h.id, day),
      [entryId(h.id, "2026-09-22")]: entry(h.id, "2026-09-22", "not-met"),
    };
    expect(streaks(h, entries, "2026-09-23")).toEqual({ current: 0, best: 1 });
  });
  it("breaks the current streak when today is explicitly unsuccessful", () => {
    const h = habit();
    const entries = {
      [entryId(h.id, day)]: entry(h.id, day),
      [entryId(h.id, "2026-09-22")]: entry(h.id, "2026-09-22", "not-met"),
    };
    expect(streaks(h, entries, "2026-09-22")).toEqual({ current: 0, best: 1 });
  });
  it("preserves archived history without adding new opportunities", () => {
    const h = habit();
    h.archivedOn = "2026-09-23";
    expect(review([h], {}, day, "2026-09-27", "2026-09-27").total).toBe(2);
  });
  it("separates failed and unlogged opportunities", () => {
    const h = habit();
    const entries = {
      [entryId(h.id, day)]: entry(h.id, day),
      [entryId(h.id, "2026-09-22")]: entry(h.id, "2026-09-22", "not-met"),
    };
    expect(review([h], entries, day, "2026-09-23", "2026-09-24")).toMatchObject(
      { met: 1, missed: 1, unlogged: 1, total: 3 },
    );
  });
});
