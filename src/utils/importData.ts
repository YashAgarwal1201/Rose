import db from "@/db";
import type {
  ActivityEntry,
  AppSettings,
  Doc,
  Folder,
  Note,
  Todo,
  TodoList,
} from "@/db/types";
import type { ExportPayload } from "./exportData";

export type ImportMode = "merge" | "replace";

export interface ImportOptions {
  settings: boolean;
  notes: boolean;
  docs: boolean;
  todos: boolean;
  activity: boolean;
  mode: ImportMode;
}

export interface ImportSummary {
  settings: number;
  notes: number;
  docs: number;
  todos: number;
  todoLists: number;
  folders: number;
  activity: number;
  version: number;
  exportDate: string;
}

export interface ImportResult {
  success: boolean;
  summary: ImportSummary;
}

const SUPPORTED_VERSIONS = [7];

/**
 * Parses and validates a File object as a Rose export payload.
 * Throws a descriptive Error if anything looks wrong.
 */
export async function parseImportFile(file: File): Promise<ExportPayload> {
  if (!file.name.endsWith(".json") && file.type !== "application/json") {
    throw new Error("Only .json backup files are supported.");
  }

  const text = await file.text();

  const parsed: unknown = (() => {
    try {
      return JSON.parse(text) as unknown;
    } catch {
      throw new Error("The file is not valid JSON.");
    }
  })();

  return validatePayload(parsed);
}

/**
 * Validates a parsed JSON value as a Rose ExportPayload.
 * Returns the typed payload or throws.
 */
export function validatePayload(raw: unknown): ExportPayload {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new Error("Invalid backup file: not a JSON object.");
  }

  const obj = raw as Record<string, unknown>;

  if (typeof obj.version !== "number") {
    throw new Error("Invalid backup file: missing version field.");
  }

  if (!SUPPORTED_VERSIONS.includes(obj.version)) {
    throw new Error(
      `Unsupported backup version ${obj.version}. Supported: ${SUPPORTED_VERSIONS.join(", ")}.`
    );
  }

  if (typeof obj.exportDate !== "string") {
    throw new Error("Invalid backup file: missing exportDate field.");
  }

  if (typeof obj.data !== "object" || obj.data === null) {
    throw new Error("Invalid backup file: missing data object.");
  }

  return obj as unknown as ExportPayload;
}

/**
 * Summarises the contents of a validated export payload without touching the DB.
 */
export function summarisePayload(payload: ExportPayload): ImportSummary {
  const { data } = payload;
  return {
    activity: data.activity?.length ?? 0,
    docs: data.docs?.length ?? 0,
    exportDate: payload.exportDate,
    folders: data.folders?.length ?? 0,
    notes: data.notes?.length ?? 0,
    settings: data.settings?.length ?? 0,
    todoLists: data.todoLists?.length ?? 0,
    todos: data.todos?.length ?? 0,
    version: payload.version,
  };
}

/**
 * Imports data from a validated ExportPayload into IndexedDB.
 *
 * - `merge`:   bulkPut (upsert) — preserves items not in the backup file.
 * - `replace`: clears each selected table first, then bulk-inserts.
 */
export async function importData(
  payload: ExportPayload,
  options: ImportOptions
): Promise<ImportResult> {
  // Vue's `ref` deep-wraps parsed JSON in Proxy objects.
  // IndexedDB's structured-clone algorithm cannot handle Proxies, so we strip
  // the reactive wrappers with a JSON round-trip before touching the database.
  // oxlint-disable-next-line unicorn/prefer-structured-clone
  const rawPayload: ExportPayload = JSON.parse(JSON.stringify(payload));
  const { data } = rawPayload;
  const { mode } = options;

  await db.transaction(
    "rw",
    [
      db.folders,
      db.todoLists,
      db.todos,
      db.notes,
      db.docs,
      db.settings,
      db.activity,
    ],
    async () => {
      // Determine which tables should be cleared in replace mode
      if (mode === "replace") {
        const tablesToClear: Promise<void>[] = [];
        if (options.notes || options.docs || options.todos) {
          tablesToClear.push(db.folders.clear());
        }
        if (options.notes) {tablesToClear.push(db.notes.clear());}
        if (options.docs) {tablesToClear.push(db.docs.clear());}
        if (options.todos) {
          tablesToClear.push(db.todoLists.clear());
          tablesToClear.push(db.todos.clear());
        }
        if (options.settings) {tablesToClear.push(db.settings.clear());}
        if (options.activity) {tablesToClear.push(db.activity.clear());}
        await Promise.all(tablesToClear);
      }

      // Folders must always be imported alongside their content types
      const needsFolders =
        options.notes || options.docs || options.todos;

      if (needsFolders && data.folders?.length) {
        await db.folders.bulkPut(data.folders as Folder[]);
      }

      if (options.notes && data.notes?.length) {
        await db.notes.bulkPut(data.notes as Note[]);
      }

      if (options.docs && data.docs?.length) {
        await db.docs.bulkPut(data.docs as Doc[]);
      }

      if (options.todos) {
        if (data.todoLists?.length) {
          await db.todoLists.bulkPut(data.todoLists as TodoList[]);
        }
        if (data.todos?.length) {
          await db.todos.bulkPut(data.todos as Todo[]);
        }
      }

      if (options.settings && data.settings?.length) {
        await db.settings.bulkPut(data.settings as AppSettings[]);
      }

      if (options.activity && data.activity?.length) {
        await db.activity.bulkPut(data.activity as ActivityEntry[]);
      }
    }
  );

  return {
    success: true,
    summary: summarisePayload(payload),
  };
}
