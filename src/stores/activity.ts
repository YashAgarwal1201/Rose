// src/stores/activity.ts
import { defineStore } from "pinia";
import db from "../db";
import type { ActivityAction, ActivityEntry } from "../db/types";

// How long a burst of autosave edits on the same item gets folded into a
// single contribution, so one editing session doesn't flood the heatmap.
const SESSION_WINDOW_MS = 15 * 60 * 1000;

// Discrete, one-off actions (creations, a checkbox click) always log fresh.
// Content-edit actions get deduped within SESSION_WINDOW_MS per item.
const SESSION_CAPPED_ACTIONS = new Set<ActivityAction>(["doc_updated", "todo_updated"]);

export const useActivityStore = defineStore("activity", () => {
  async function record(type: ActivityAction, entityId: string) {
    const now = Date.now();

    if (SESSION_CAPPED_ACTIONS.has(type)) {
      const cutoff = now - SESSION_WINDOW_MS;
      const alreadyLogged = await db.activity
        .where("entityId")
        .equals(entityId)
        .and((entry) => entry.type === type && entry.timestamp >= cutoff)
        .first();
      if (alreadyLogged) {
        return;
      }
    }

    const entry: ActivityEntry = {
      entityId,
      id: crypto.randomUUID(),
      timestamp: now,
      type,
    };
    await db.activity.add(entry);
  }

  async function getEntriesSince(sinceTimestamp: number): Promise<ActivityEntry[]> {
    return db.activity.where("timestamp").aboveOrEqual(sinceTimestamp).toArray();
  }

  return { getEntriesSince, record };
});
