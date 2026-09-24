import { useEffect, useState } from "react";
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
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark =
        preference === "dark" || (preference === "system" && media.matches);
      document.documentElement.dataset.theme = dark ? "dark" : "light";
      document.documentElement.style.colorScheme = dark ? "dark" : "light";
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute("content", dark ? "#101813" : "#F7F8F5");
    };
    const storage = (event: StorageEvent) => {
      if (event.key === THEME_KEY || event.key === null)
        setPreference(readTheme());
    };
    apply();
    media.addEventListener("change", apply);
    window.addEventListener("storage", storage);
    return () => {
      media.removeEventListener("change", apply);
      window.removeEventListener("storage", storage);
    };
  }, [preference]);
  function choose(value: ThemePreference) {
    setPreference(value);
    try {
      localStorage.setItem(THEME_KEY, value);
    } catch {
      /* Applies for this session if storage is unavailable. */
    }
  }
  return { preference, choose };
}
