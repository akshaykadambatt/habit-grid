import { readFileSync } from "node:fs";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, writeBatch } from "firebase/firestore";
import { HABIT_ICONS } from "../src/domain/icons";
import { COLORS, starterHabits } from "../src/domain/model";
import { beforeAll, afterAll, describe, it } from "vitest";
let environment: RulesTestEnvironment;
beforeAll(async () => {
  environment = await initializeTestEnvironment({
    projectId: "demo-habit-grid",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
});
afterAll(async () => environment?.cleanup());
const settings = {
  version: 1,
  timezone: "America/Toronto",
  onboarded: true,
  installDismissed: false,
  lastBackup: null,
  dataset: "primary",
};
describe("Firestore ownership", () => {
  it("accepts every curated appearance and rejects unknown icons and colors", async () => {
    const db = environment.authenticatedContext("alice").firestore();
    const batch = writeBatch(db);
    const habit = starterHabits("2026-01-01")[0];
    for (const [index, icon] of HABIT_ICONS.entries()) {
      const id = `appearance-${index}`;
      batch.set(doc(db, `users/alice/datasets/primary/habits/${id}`), {
        ...habit,
        id,
        icon: icon.id,
        color: COLORS[index % COLORS.length],
      });
    }
    await assertSucceeds(batch.commit());
    const ref = doc(db, `users/alice/datasets/primary/habits/${habit.id}`);
    await assertFails(setDoc(ref, { ...habit, icon: "unknown-icon" }));
    await assertFails(setDoc(ref, { ...habit, color: "#ff0000" }));
  });
  it("allows the owner to create and read their profile", async () => {
    const db = environment.authenticatedContext("alice").firestore();
    await assertSucceeds(setDoc(doc(db, "users/alice"), settings));
    await assertSucceeds(getDoc(doc(db, "users/alice")));
  });
  it("rejects anonymous access", async () => {
    const db = environment.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, "users/alice")));
    await assertFails(setDoc(doc(db, "users/alice"), settings));
  });
  it("rejects cross-user reads and writes", async () => {
    const db = environment.authenticatedContext("bob").firestore();
    await assertFails(getDoc(doc(db, "users/alice")));
    await assertFails(setDoc(doc(db, "users/alice"), settings));
    await assertFails(
      getDoc(doc(db, "users/alice/datasets/primary/entries/habit_2026-09-24")),
    );
  });
  it("validates entry fields and stable document IDs", async () => {
    const db = environment.authenticatedContext("alice").firestore();
    const ref = doc(
      db,
      "users/alice/datasets/primary/entries/habit_2026-09-24",
    );
    const entry = {
      habitId: "habit",
      date: "2026-09-24",
      status: "met",
      value: null,
      updatedAt: new Date().toISOString(),
    };
    await assertSucceeds(setDoc(ref, entry));
    await assertFails(setDoc(ref, { ...entry, status: "anything" }));
    await assertFails(setDoc(ref, { ...entry, habitId: "other" }));
    await assertFails(setDoc(ref, { ...entry, value: -1 }));
    await assertFails(setDoc(ref, { ...entry, unexpected: "field" }));
  });
  it("rejects malformed profile settings", async () => {
    const db = environment.authenticatedContext("alice").firestore();
    await assertFails(
      setDoc(doc(db, "users/alice"), { ...settings, version: 2 }),
    );
  });
});
