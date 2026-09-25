import { describe, expect, it } from "vitest";
import { dateWindow, daysBetween, timelineStart } from "../src/domain/timeline";

describe("continuous history date window", () => {
  it("includes old habits and keeps room for backfilling recent ones", () => {
    expect(timelineStart("2026-09-25", ["2020-02-01"])).toBe("2020-02-01");
    expect(timelineStart("2026-09-25", ["2026-09-25"])).toBe("2026-03-29");
    expect(timelineStart("2000-01-03", [])).toBe("2000-01-01");
  });
  it("counts calendar dates through leap days and DST changes", () => {
    expect(daysBetween("2024-02-28", "2024-03-01")).toBe(2);
    expect(daysBetween("2026-03-07", "2026-03-09")).toBe(2);
  });
  it("renders only nearby dates even with decades of history", () => {
    const window = dateWindow(10000, 5000 * 56 + 12, 390, 112, 56);
    expect(window).toEqual({ first: 5000, last: 5005, from: 4993, to: 5012 });
  });
  it("clamps overscan at both ends without creating future dates", () => {
    expect(dateWindow(181, 0, 390, 112, 56)).toEqual({
      first: 0,
      last: 4,
      from: 0,
      to: 11,
    });
    expect(dateWindow(181, 181 * 56 - 390 + 112, 390, 112, 56)).toEqual({
      first: 176,
      last: 180,
      from: 169,
      to: 180,
    });
  });
});
