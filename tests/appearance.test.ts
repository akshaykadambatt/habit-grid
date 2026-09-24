import { describe, expect, it } from "vitest";
import { HABIT_ICONS, searchIcons } from "../src/domain/icons";
import { HABIT_PALETTE } from "../src/domain/colors";
import { emptyData, starterHabits } from "../src/domain/model";
import { parseBackup, exportBackup } from "../src/domain/backup";
import { habitIconComponents } from "../src/components/HabitIcon";

function luminance(hex: string) {
  const values = hex
    .slice(1)
    .match(/../g)!
    .map((channel) => {
      const value = parseInt(channel, 16) / 255;
      return value <= 0.04045
        ? value / 12.92
        : ((value + 0.055) / 1.055) ** 2.4;
    });
  return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
}
describe("habit appearance", () => {
  it("finds meaningful icons by labels, activities, and combinations of search words", () => {
    expect(searchIcons("reading").map((icon) => icon.id)).toContain("book");
    expect(searchIcons("  MUSIC practice ").map((icon) => icon.id)).toEqual([
      "music",
      "guitar",
    ]);
    expect(searchIcons("not-a-real-activity")).toEqual([]);
    expect(searchIcons("")).toHaveLength(48);
  });
  it("provides a renderable component for every persisted icon", () => {
    for (const icon of HABIT_ICONS)
      expect(habitIconComponents[icon.id]).toBeDefined();
  });
  it("round-trips every icon and color without dropping older backups", () => {
    const data = emptyData("UTC");
    data.habits = HABIT_ICONS.map((icon, index) => ({
      ...starterHabits("2026-01-01")[0],
      icon: icon.id,
      color: HABIT_PALETTE[index % HABIT_PALETTE.length].id,
    }));
    expect(parseBackup(exportBackup(data))).toEqual(data);
    expect(
      parseBackup(
        exportBackup({ ...data, habits: starterHabits("2026-01-01") }),
      ),
    ).toBeDefined();
  });
  it("meets AA text contrast and non-text selection contrast on every palette fill", () => {
    for (const color of HABIT_PALETTE) {
      for (const foreground of ["#17211D", "#236B49"]) {
        expect(
          (luminance(color.hex) + 0.05) / (luminance(foreground) + 0.05),
          color.label,
        ).toBeGreaterThanOrEqual(foreground === "#17211D" ? 4.5 : 3);
      }
    }
  });
});
