import { readFileSync } from "node:fs";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";
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
