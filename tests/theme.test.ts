import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { APP_THEMES, parseScheme } from "../src/data/themes";
const styles = readFileSync("src/styles.css", "utf8");
function variables(block: string) {
  return Object.fromEntries(
    [...block.matchAll(/(--[\w-]+):\s*(#[a-f\d]{6});/gi)].map((match) => [
      match[1],
      match[2],
    ]),
  );
}
function luminance(hex: string) {
  const channels = hex
    .slice(1)
    .match(/../g)!
    .map((value) => {
      const channel = parseInt(value, 16) / 255;
      return channel <= 0.04045
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4;
    });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
function contrast(a: string, b: string) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
}
describe("theme contrast", () => {
  const light = variables(styles.match(/:root\s*\{([^}]+)\}/)![1]);
  const dark = {
    ...light,
    ...variables(styles.match(/:root\[data-theme="dark"\]\s*\{([^}]+)\}/)![1]),
  };
  const palettes: Record<string, Record<string, string>> = { light, dark };
  for (const { id } of APP_THEMES.filter((theme) => theme.id !== "botanical")) {
    const overrides = (selector: string) =>
      variables(
        styles.slice(styles.indexOf(selector)).match(/\{([^}]+)\}/)![1],
      );
    const scheme = overrides(`:root[data-scheme="${id}"]`);
    palettes[`${id} light`] = { ...light, ...scheme };
    palettes[`${id} dark`] = {
      ...dark,
      ...scheme,
      ...overrides(`:root[data-theme="dark"][data-scheme="${id}"]`),
    };
  }
  for (const [name, palette] of Object.entries(palettes)) {
    it(`${name} keeps text readable on surfaces, actions, and feedback`, () => {
      for (const [text, background] of [
        ["--ink", "--page"],
        ["--ink", "--surface"],
        ["--ink", "--surface-selected"],
        ["--muted", "--page"],
        ["--muted", "--surface"],
        ["--muted", "--neutral-fill"],
        ["--green", "--page"],
        ["--primary-ink", "--primary-bg"],
        ["--on-strong", "--strong-bg"],
        ["--toast-ink", "--toast-bg"],
        ["--toast-action", "--toast-bg"],
        ["--danger-ink", "--danger-surface"],
      ])
        expect(
          contrast(palette[text], palette[background]),
          `${text} on ${background}`,
        ).toBeGreaterThanOrEqual(4.5);
    });
    it(`${name} distinguishes focus rings and empty controls`, () => {
      for (const foreground of ["--focus", "--control-line"]) {
        for (const background of ["--page", "--surface"]) {
          expect(
            contrast(palette[foreground], palette[background]),
            `${foreground} on ${background}`,
          ).toBeGreaterThanOrEqual(3);
        }
      }
    });
  }
});

it("restores supported schemes and safely falls back for invalid stored preferences", () => {
  for (const { id } of APP_THEMES) expect(parseScheme(id)).toBe(id);
  for (const value of [null, undefined, "", "unknown", "Dark", {}, 1])
    expect(parseScheme(value)).toBe("botanical");
});
