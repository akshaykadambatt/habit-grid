import { useEffect, useRef } from "react";
import { dayState, isScheduled, type Data, type Habit } from "../domain/model";
type Tool = {
  name: string;
  title: string;
  description: string;
  inputSchema: object;
  annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
  execute: (input: unknown) => unknown | Promise<unknown>;
};
type Context = {
  registerTool: (
    tool: Tool,
    options: { signal: AbortSignal },
  ) => void | Promise<void>;
};
export function useAgentTools(
  data: Data,
  today: string,
  onOpen: (habit: Habit, date: string) => void,
  enabled: boolean,
) {
  const current = useRef({ data, today, onOpen, enabled });
  current.current = { data, today, onOpen, enabled };
  useEffect(() => {
    const context = (document as Document & { modelContext?: Context })
      .modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = (tool: Tool) => {
      try {
        void Promise.resolve(
          context.registerTool(tool, { signal: lifecycle.signal }),
        ).catch(() => {});
      } catch {
        /* Optional browser capability. */
      }
    };
    register({
      name: "list_today_habits",
      title: "List today’s habits",
      description:
        "Read scheduled habits and their current check-in status for the signed-in account.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: () => {
        const { data, today, enabled } = current.current;
        if (!enabled) throw new Error("Open a habit profile first.");
        return {
          date: today,
          habits: data.habits
            .filter((h) => isScheduled(h, today))
            .map((h) => ({
              id: h.id,
              name: h.name,
              status: dayState(h, today, data.entries, today),
            })),
        };
      },
    });
    register({
      name: "open_habit_checkin",
      title: "Open a habit check-in",
      description:
        "Open the visible check-in sheet for a scheduled habit today. Does not record or change a completion.",
      inputSchema: {
        type: "object",
        properties: { habitId: { type: "string" } },
        required: ["habitId"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      execute: async (input) => {
        if (
          !input ||
          typeof input !== "object" ||
          !("habitId" in input) ||
          typeof input.habitId !== "string" ||
          Object.keys(input).length !== 1
        )
          throw new Error("Provide a habitId.");
        const { data, today, onOpen, enabled } = current.current;
        const habit = data.habits.find(
          (h) => h.id === input.habitId && isScheduled(h, today),
        );
        if (!enabled || !habit)
          throw new Error("This habit is not scheduled today.");
        onOpen(habit, today);
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        );
        return { opened: true, habitId: habit.id, date: today };
      },
    });
    return () => lifecycle.abort();
  }, []);
}
