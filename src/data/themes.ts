export const SCHEME_KEY = "habit-grid.color-scheme";
export const APP_THEMES = [
  {
    id: "botanical",
    name: "Botanical",
    description: "Soft greens · gently rounded",
  },
  {
    id: "electric",
    name: "Electric",
    description: "Cobalt blue · bold outlines",
  },
  { id: "clay", name: "Clay", description: "Warm terracotta · soft edges" },
  { id: "paper", name: "Paper", description: "Ink & ivory · flat and crisp" },
  { id: "bloom", name: "Bloom", description: "Vivid violet · extra rounded" },
] as const;
export type AppTheme = (typeof APP_THEMES)[number]["id"];
export function parseScheme(value: unknown): AppTheme {
  return APP_THEMES.some((theme) => theme.id === value)
    ? (value as AppTheme)
    : "botanical";
}
export function readScheme(): AppTheme {
  try {
    return parseScheme(localStorage.getItem(SCHEME_KEY));
  } catch {
    return "botanical";
  }
}
