export const HABIT_PALETTE = [
  { id: "mint", label: "Mint", group: "Fresh", hex: "#CBE8BD" },
  { id: "sage", label: "Sage", group: "Fresh", hex: "#D7E2C4" },
  { id: "fern", label: "Fern", group: "Fresh", hex: "#BBD4B1" },
  { id: "teal", label: "Sea glass", group: "Fresh", hex: "#B8DCD1" },
  { id: "aqua", label: "Aqua", group: "Fresh", hex: "#C6E9E4" },
  { id: "sky", label: "Sky", group: "Fresh", hex: "#CCE7F3" },
  { id: "blue", label: "Bluebell", group: "Soft", hex: "#C9DBF5" },
  { id: "periwinkle", label: "Periwinkle", group: "Soft", hex: "#D2D7F6" },
  { id: "lavender", label: "Lavender", group: "Soft", hex: "#DCD8F6" },
  { id: "lilac", label: "Lilac", group: "Soft", hex: "#E9D4EE" },
  { id: "rose", label: "Rose", group: "Soft", hex: "#F0D3DD" },
  { id: "blush", label: "Blush", group: "Soft", hex: "#F4DEE7" },
  { id: "peach", label: "Peach", group: "Warm", hex: "#F6DCC8" },
  { id: "coral", label: "Coral", group: "Warm", hex: "#F2C9BC" },
  { id: "apricot", label: "Apricot", group: "Warm", hex: "#F6D4AC" },
  { id: "yellow", label: "Butter", group: "Warm", hex: "#F0EDB9" },
  { id: "sand", label: "Sand", group: "Warm", hex: "#E8DCC5" },
  { id: "stone", label: "Pebble", group: "Warm", hex: "#DEDFD5" },
] as const;
export type Color = (typeof HABIT_PALETTE)[number]["id"];
export const COLORS = HABIT_PALETTE.map((color) => color.id);
