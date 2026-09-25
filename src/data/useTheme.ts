import { useEffect, useState } from "react";
import { readScheme, SCHEME_KEY, type AppTheme } from "./themes";
export type ThemePreference = "system" | "light" | "dark";
export const THEME_KEY = "habit-grid.appearance";
export function readTheme(): ThemePreference {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}
export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>(readTheme);
  const [scheme, setScheme] = useState<AppTheme>(readScheme);
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark =
        preference === "dark" || (preference === "system" && media.matches);
      document.documentElement.dataset.theme = dark ? "dark" : "light";
      document.documentElement.dataset.scheme = scheme;
      document.documentElement.style.colorScheme = dark ? "dark" : "light";
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute(
          "content",
          getComputedStyle(document.documentElement)
            .getPropertyValue("--page")
            .trim(),
        );
    };
    const storage = (event: StorageEvent) => {
      if (event.key === THEME_KEY || event.key === null)
        setPreference(readTheme());
      if (event.key === SCHEME_KEY || event.key === null)
        setScheme(readScheme());
    };
    apply();
    media.addEventListener("change", apply);
    window.addEventListener("storage", storage);
    return () => {
      media.removeEventListener("change", apply);
      window.removeEventListener("storage", storage);
    };
  }, [preference, scheme]);
  function choose(value: ThemePreference) {
    setPreference(value);
    try {
      localStorage.setItem(THEME_KEY, value);
    } catch {
      /* Applies for this session if storage is unavailable. */
    }
  }
  function chooseScheme(value: AppTheme) {
    setScheme(value);
    try {
      localStorage.setItem(SCHEME_KEY, value);
    } catch {
      /* Applies for this session if storage is unavailable. */
    }
  }
  return { preference, choose, scheme, chooseScheme };
}
