import { describe, expect, it } from "vitest";
import {
  dayState,
  entryId,
  numericProgress,
  reviseHabit,
  starterHabits,
  type Entry,
  type Habit,
} from "../src/domain/model";

const today = "2026-10-08";
const sleep = () => starterHabits("2026-10-01")[2];
function entries(
  habit: Habit,
  value: number | null,
  date = today,
  status: Entry["status"] = "met",
) {
  return {
    [entryId(habit.id, date)]: {
      habitId: habit.id,
      date,
      value,
      status,
      updatedAt: "2026-10-08T12:00:00Z",
    },
  };
}
describe("numeric fill progress", () => {
  it("scales decimals toward the goal, caps overachievement, and keeps zero explicitly unmet", () => {
    const h = sleep();
    for (const [value, fill] of [
      [0, 0],
      [2.25, 0.25],
      [4.5, 0.5],
      [9, 1],
      [12, 1],
    ]) {
      const data = entries(h, value);
      expect(numericProgress(h, today, data, today)).toBe(fill);
      expect(dayState(h, today, data, today)).toBe(
        value >= 9 ? "met" : "not-met",
      );
    }
  });
  it("does not invent fills for missing, cleared, invalid, checkbox, rest, archived, or future dates", () => {
    const h = sleep();
    expect(numericProgress(h, today, {}, today)).toBeNull();
    for (const value of [null, NaN, Infinity, -1])
      expect(numericProgress(h, today, entries(h, value), today)).toBeNull();
    expect(
      numericProgress(h, today, entries(h, 4, today, "unlogged"), today),
    ).toBeNull();
    for (const other of [
      starterHabits("2026-10-01")[0],
      { ...h, archivedOn: today },
      { ...h, rules: [{ ...h.rules[0], days: [] }] },
    ])
      expect(
        numericProgress(other, today, entries(other, 4), today),
      ).toBeNull();
    expect(
      numericProgress(h, "2026-10-09", entries(h, 4, "2026-10-09"), today),
    ).toBeNull();
  });
  it("uses the goal effective on the logged date", () => {
    const h = sleep();
    const revised = reviseHabit(h, { ...h.rules[0], target: 6 }, today);
    expect(
      numericProgress(
        revised,
        "2026-10-07",
        entries(h, 4.5, "2026-10-07"),
        today,
      ),
    ).toBe(0.5);
    expect(numericProgress(revised, today, entries(h, 4.5), today)).toBe(0.75);
  });
  it("respects at-most and range goals including legitimate zero targets", () => {
    const h = sleep();
    h.rules[0].comparison = "max";
    expect(numericProgress(h, today, entries(h, 0), today)).toBe(1);
    expect(numericProgress(h, today, entries(h, 18), today)).toBe(0.5);
    h.rules[0].target = 0;
    expect(numericProgress(h, today, entries(h, 1), today)).toBe(0);
    expect(numericProgress(h, today, entries(h, 0), today)).toBe(1);
    h.rules[0] = { ...h.rules[0], comparison: "range", target: 8, upper: 10 };
    for (const [value, fill] of [
      [0, 0],
      [4, 0.5],
      [8, 1],
      [9, 1],
      [10, 1],
      [20, 0.5],
    ])
      expect(numericProgress(h, today, entries(h, value), today)).toBe(fill);
  });
});
