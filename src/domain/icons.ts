export const HABIT_ICONS = [
  {
    id: "habit",
    label: "Sprout",
    group: "Everyday",
    keywords: "growth plant new",
  },
  { id: "check", label: "Check", group: "Everyday", keywords: "done complete" },
  {
    id: "calendar",
    label: "Calendar",
    group: "Everyday",
    keywords: "schedule daily",
  },
  { id: "clock", label: "Clock", group: "Everyday", keywords: "time minutes" },
  { id: "target", label: "Target", group: "Everyday", keywords: "goal focus" },
  {
    id: "trophy",
    label: "Trophy",
    group: "Everyday",
    keywords: "achievement win",
  },
  {
    id: "repeat",
    label: "Repeat",
    group: "Everyday",
    keywords: "routine consistency",
  },
  {
    id: "list",
    label: "Checklist",
    group: "Everyday",
    keywords: "tasks planning",
  },
  {
    id: "workout",
    label: "Weights",
    group: "Movement",
    keywords: "gym exercise strength workout dumbbell",
  },
  {
    id: "walk",
    label: "Walking",
    group: "Movement",
    keywords: "steps running footprints",
  },
  {
    id: "bike",
    label: "Bicycle",
    group: "Movement",
    keywords: "cycling ride cardio",
  },
  {
    id: "activity",
    label: "Activity",
    group: "Movement",
    keywords: "fitness exercise",
  },
  {
    id: "pulse",
    label: "Heart pulse",
    group: "Movement",
    keywords: "health cardio",
  },
  {
    id: "stretch",
    label: "Stretching",
    group: "Movement",
    keywords: "yoga mobility standing",
  },
  {
    id: "mountain",
    label: "Mountain",
    group: "Movement",
    keywords: "hiking outdoors climbing",
  },
  {
    id: "waves",
    label: "Waves",
    group: "Movement",
    keywords: "swim swimming ocean",
  },
  {
    id: "brain",
    label: "Brain",
    group: "Mind",
    keywords: "meditation learning thinking",
  },
  {
    id: "book",
    label: "Book",
    group: "Mind",
    keywords: "reading pages literature",
  },
  {
    id: "journal",
    label: "Journal",
    group: "Mind",
    keywords: "writing diary notebook",
  },
  {
    id: "study",
    label: "Graduation",
    group: "Mind",
    keywords: "study education school",
  },
  {
    id: "language",
    label: "Languages",
    group: "Mind",
    keywords: "practice speaking learning",
  },
  {
    id: "idea",
    label: "Light bulb",
    group: "Mind",
    keywords: "ideas learning creativity",
  },
  {
    id: "puzzle",
    label: "Puzzle",
    group: "Mind",
    keywords: "games brain challenge",
  },
  {
    id: "focus",
    label: "Focus",
    group: "Mind",
    keywords: "concentration meditation attention",
  },
  {
    id: "food",
    label: "Cutlery",
    group: "Food & drink",
    keywords: "food eating meal restaurant",
  },
  {
    id: "leaf",
    label: "Leaf",
    group: "Food & drink",
    keywords: "healthy plant vegetables",
  },
  {
    id: "water",
    label: "Water",
    group: "Food & drink",
    keywords: "hydration drink droplets",
  },
  {
    id: "apple",
    label: "Apple",
    group: "Food & drink",
    keywords: "fruit nutrition snack",
  },
  {
    id: "carrot",
    label: "Carrot",
    group: "Food & drink",
    keywords: "vegetable nutrition",
  },
  {
    id: "salad",
    label: "Salad",
    group: "Food & drink",
    keywords: "food healthy lunch",
  },
  {
    id: "coffee",
    label: "Coffee",
    group: "Food & drink",
    keywords: "tea drink caffeine",
  },
  {
    id: "cooking",
    label: "Cooking pot",
    group: "Food & drink",
    keywords: "cook dinner meal prep",
  },
  {
    id: "sleep",
    label: "Moon",
    group: "Self-care",
    keywords: "sleep bedtime night rest",
  },
  {
    id: "sun",
    label: "Sun",
    group: "Self-care",
    keywords: "morning daylight sunshine",
  },
  {
    id: "bed",
    label: "Bed",
    group: "Self-care",
    keywords: "sleep rest bedtime",
  },
  {
    id: "shower",
    label: "Shower",
    group: "Self-care",
    keywords: "wash hygiene clean",
  },
  {
    id: "smile",
    label: "Smile",
    group: "Self-care",
    keywords: "mood happiness gratitude",
  },
  {
    id: "heart",
    label: "Heart",
    group: "Self-care",
    keywords: "love health kindness",
  },
  {
    id: "flower",
    label: "Flower",
    group: "Self-care",
    keywords: "calm garden nature",
  },
  {
    id: "hand",
    label: "Hand",
    group: "Self-care",
    keywords: "care help pause",
  },
  {
    id: "music",
    label: "Music",
    group: "Life & hobbies",
    keywords: "piano practice instrument",
  },
  {
    id: "guitar",
    label: "Guitar",
    group: "Life & hobbies",
    keywords: "music instrument practice",
  },
  {
    id: "art",
    label: "Palette",
    group: "Life & hobbies",
    keywords: "art paint draw creativity",
  },
  {
    id: "camera",
    label: "Camera",
    group: "Life & hobbies",
    keywords: "photo photography",
  },
  {
    id: "code",
    label: "Code",
    group: "Life & hobbies",
    keywords: "programming development computer",
  },
  {
    id: "work",
    label: "Briefcase",
    group: "Life & hobbies",
    keywords: "work career job",
  },
  {
    id: "home",
    label: "House",
    group: "Life & hobbies",
    keywords: "home tidy cleaning family",
  },
  {
    id: "savings",
    label: "Piggy bank",
    group: "Life & hobbies",
    keywords: "money budget savings",
  },
] as const;
export type HabitIconId = (typeof HABIT_ICONS)[number]["id"];
export const HABIT_ICON_IDS = HABIT_ICONS.map((icon) => icon.id);
export function searchIcons(query: string) {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return HABIT_ICONS.filter((icon) =>
    words.every((word) =>
      `${icon.label} ${icon.group} ${icon.keywords}`
        .toLowerCase()
        .includes(word),
    ),
  );
}
