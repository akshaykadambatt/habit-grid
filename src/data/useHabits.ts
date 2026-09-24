import { useCallback, useEffect, useRef, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  startAfter,
  where,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { auth, db, finishSignIn } from "./firebase";
import {
  addDays,
  emptyData,
  entryId,
  localDate,
  type Data,
  type Entry,
  type Habit,
  type Settings,
} from "../domain/model";
import { parseBackup } from "../domain/backup";

const LOCAL_KEY = "habit-grid.local.v1";
const MODE_KEY = "habit-grid.local-mode";
export type SyncState =
  | "loading"
  | "local"
  | "synced"
  | "pending"
  | "offline"
  | "error";
export function useHabits() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(!auth);
  const [localMode, setLocalMode] = useState(
    () => localStorage.getItem(MODE_KEY) === "true",
  );
  const [data, setData] = useState<Data>(emptyData);
  const dataRef = useRef(data);
  dataRef.current = data;
  const [sync, setSync] = useState<SyncState>("loading");
  const [error, setError] = useState("");
  const [authError, setAuthError] = useState("");
  const [online, setOnline] = useState(navigator.onLine);
  const dataset = useRef("primary");
  const [activeDataset, setActiveDataset] = useState("primary");
  const retries = useRef<Array<() => Promise<unknown>>>([]);
  const pendingCount = useRef(0);
  const snapshotPending = useRef({
    profile: false,
    habits: false,
    entries: false,
  });
  const hasPending = () =>
    pendingCount.current > 0 ||
    Object.values(snapshotPending.current).some(Boolean);
  const cloud = !!user && !!db;
  useEffect(() => {
    let active = true;
    void finishSignIn().then((message) => {
      if (active) setAuthError(message);
    });
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    const stop = auth
      ? onAuthStateChanged(auth, (u) => {
          setUser(u);
          if (u) setAuthError("");
          setAuthReady(true);
          setData(emptyData());
        })
      : () => {};
    return () => {
      active = false;
      stop();
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  useEffect(() => {
    if (!authReady) return;
    setError("");
    retries.current = [];
    if (!cloud) {
      try {
        const raw = localMode ? localStorage.getItem(LOCAL_KEY) : null;
        setData(raw ? parseBackup(raw) : emptyData());
        setSync("local");
      } catch {
        setError(
          "Could not read saved data on this device. Keep a copy of your browser data before clearing storage.",
        );
        setSync("error");
      }
      return;
    }
    const uid = user!.uid;
    let unsubscribers: Array<() => void> = [];
    let live = true;
    let active = "";
    setSync("loading");
    const fail = (e: Error) => {
      if (live) {
        setError(`Could not sync your habits. ${e.message}`);
        setSync("error");
      }
    };
    const stopProfile = onSnapshot(
      doc(db!, "users", uid),
      { includeMetadataChanges: true },
      (profile) => {
        if (!live) return;
        snapshotPending.current.profile = profile.metadata.hasPendingWrites;
        const profileData = profile.data();
        const settings = profileData
          ? ((({ dataset: _, ...rest }) => rest)(profileData) as Settings)
          : emptyData().settings;
        setData((old) => ({ ...old, settings }));
        const nextDataset = profileData?.dataset || "primary";
        if (nextDataset === active) {
          if (hasPending()) setSync("pending");
          else setSync((state) => (state === "pending" ? "synced" : state));
          return;
        }
        active = nextDataset;
        setSync("loading");
        dataset.current = active;
        setActiveDataset(active);
        snapshotPending.current.habits = false;
        snapshotPending.current.entries = false;
        unsubscribers.forEach((stop) => stop());
        setData((old) => ({ ...old, habits: [], entries: {} }));
        const base = ["users", uid, "datasets", active] as const;
        const boundary = addDays(localDate(settings.timezone), -90);
        let habitsReady = false,
          entriesReady = false;
        const ready = () => {
          if (habitsReady && entriesReady)
            setSync(hasPending() ? "pending" : "synced");
        };
        unsubscribers = [
          onSnapshot(
            collection(db!, ...base, "habits"),
            { includeMetadataChanges: true },
            (snapshot) => {
              snapshotPending.current.habits =
                snapshot.metadata.hasPendingWrites;
              setData((old) => ({
                ...old,
                habits: snapshot.docs
                  .map((d) => d.data() as Habit)
                  .sort((a, b) => a.order - b.order),
              }));
              habitsReady = true;
              ready();
            },
            fail,
          ),
          onSnapshot(
            query(
              collection(db!, ...base, "entries"),
              where("date", ">=", boundary),
            ),
            { includeMetadataChanges: true },
            (snapshot) => {
              snapshotPending.current.entries =
                snapshot.metadata.hasPendingWrites;
              setData((old) => {
                const entries = { ...old.entries };
                for (const d of snapshot.docs)
                  entries[d.id] = d.data() as Entry;
                return { ...old, entries };
              });
              entriesReady = true;
              ready();
            },
            fail,
          ),
        ];
        // Older history is read once, in bounded pages. Live changes focus on the recent 90 days.
        void (async () => {
          let cursor: QueryDocumentSnapshot<DocumentData> | undefined;
          const expected = active;
          do {
            const constraints = [
              where("date", "<", boundary),
              orderBy("date"),
              limit(250),
              ...(cursor ? [startAfter(cursor)] : []),
            ];
            const page = await getDocs(
              query(collection(db!, ...base, "entries"), ...constraints),
            );
            if (!live || active !== expected) return;
            setData((old) => {
              const entries = { ...old.entries };
              for (const d of page.docs) entries[d.id] = d.data() as Entry;
              return { ...old, entries };
            });
            cursor =
              page.size === 250 ? page.docs[page.docs.length - 1] : undefined;
          } while (cursor);
        })().catch(fail);
      },
      fail,
    );
    return () => {
      live = false;
      stopProfile();
      unsubscribers.forEach((stop) => stop());
    };
  }, [authReady, cloud, user, localMode]);

  function persistLocal(next: Data) {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
      dataRef.current = next;
      setData(next);
      setSync("local");
      setError("");
    } catch {
      setError(
        "This device could not save your change. Free browser storage and try again.",
      );
      setSync("error");
      throw new Error("Device storage is full or unavailable.");
    }
  }
  function send(operation: () => Promise<unknown>) {
    pendingCount.current++;
    setSync("pending");
    setError("");
    void operation()
      .then(() => {
        pendingCount.current--;
        if (!retries.current.length && !hasPending()) {
          setSync("synced");
          setError("");
        }
      })
      .catch((e: Error) => {
        pendingCount.current--;
        retries.current.push(operation);
        setSync("error");
        setError(`Your change has not synced. ${e.message}`);
      });
  }
  function saveEntry(entry: Entry, habitUpdate?: Habit) {
    const id = entryId(entry.habitId, entry.date);
    const next = {
      ...dataRef.current,
      entries: { ...dataRef.current.entries, [id]: entry },
      habits: habitUpdate
        ? dataRef.current.habits.map((h) =>
            h.id === habitUpdate.id ? habitUpdate : h,
          )
        : dataRef.current.habits,
    };
    if (!cloud) {
      persistLocal(next);
      return;
    }
    dataRef.current = next;
    setData(next);
    send(() => {
      const batch = writeBatch(db!);
      if (habitUpdate)
        batch.set(
          doc(
            db!,
            "users",
            user!.uid,
            "datasets",
            dataset.current,
            "habits",
            habitUpdate.id,
          ),
          habitUpdate,
        );
      batch.set(
        doc(
          db!,
          "users",
          user!.uid,
          "datasets",
          dataset.current,
          "entries",
          id,
        ),
        entry,
      );
      return batch.commit();
    });
  }
  function saveHabits(habits: Habit[]) {
    if (habits.length > 200)
      throw new Error(
        "This version supports up to 200 habits, including archived habits.",
      );
    if (!cloud) {
      persistLocal({ ...dataRef.current, habits });
      return;
    }
    const changed = habits.filter(
      (h) =>
        JSON.stringify(h) !==
        JSON.stringify(dataRef.current.habits.find((old) => old.id === h.id)),
    );
    dataRef.current = { ...dataRef.current, habits };
    setData(dataRef.current);
    send(() => {
      const batch = writeBatch(db!);
      for (const habit of changed)
        batch.set(
          doc(
            db!,
            "users",
            user!.uid,
            "datasets",
            dataset.current,
            "habits",
            habit.id,
          ),
          habit,
        );
      return batch.commit();
    });
  }
  function saveSettings(settings: Settings) {
    if (!cloud) {
      persistLocal({ ...dataRef.current, settings });
      return;
    }
    dataRef.current = { ...dataRef.current, settings };
    setData(dataRef.current);
    send(() =>
      setDoc(doc(db!, "users", user!.uid), {
        ...settings,
        dataset: dataset.current,
      }),
    );
  }
  async function replaceData(next: Data) {
    parseBackup(JSON.stringify(next));
    if (!cloud) {
      persistLocal(next);
      return;
    }
    if (!online)
      throw new Error("Connect to the internet before replacing cloud data.");
    const nextDataset = crypto.randomUUID();
    const records = [
      ...next.habits.map((h) => ({ path: "habits", id: h.id, value: h })),
      ...Object.entries(next.entries).map(([id, e]) => ({
        path: "entries",
        id,
        value: e,
      })),
    ];
    for (let start = 0; start < records.length; start += 400) {
      const batch = writeBatch(db!);
      for (const record of records.slice(start, start + 400))
        batch.set(
          doc(
            db!,
            "users",
            user!.uid,
            "datasets",
            nextDataset,
            record.path,
            record.id,
          ),
          record.value,
        );
      await batch.commit();
    }
    await setDoc(doc(db!, "users", user!.uid), {
      ...next.settings,
      dataset: nextDataset,
    });
  }
  function retry() {
    const pending = retries.current.splice(0);
    if (!pending.length) {
      location.reload();
      return;
    }
    pending.forEach(send);
  }
  function startLocal() {
    localStorage.setItem(MODE_KEY, "true");
    setLocalMode(true);
  }
  const watchHistory = useCallback(
    (start: string, end: string) => {
      if (!db || !user) return () => {};
      return onSnapshot(
        query(
          collection(
            db,
            "users",
            user.uid,
            "datasets",
            activeDataset,
            "entries",
          ),
          where("date", ">=", start),
          where("date", "<=", end),
        ),
        (snapshot) => {
          setData((old) => {
            const entries = { ...old.entries };
            for (const entry of snapshot.docs)
              entries[entry.id] = entry.data() as Entry;
            return { ...old, entries };
          });
        },
        () =>
          setError(
            "This history window could not refresh. Reconnect and try again.",
          ),
      );
    },
    [user, activeDataset],
  );
  return {
    data,
    user,
    authReady,
    localMode,
    startLocal,
    saveEntry,
    saveHabits,
    saveSettings,
    replaceData,
    retry,
    error,
    authError,
    setError,
    sync: error ? "error" : !online ? "offline" : sync,
    online,
    cloud,
    watchHistory,
  };
}
