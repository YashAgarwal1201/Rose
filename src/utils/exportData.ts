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

export interface ExportOptions {
  settings: boolean;
  notes: boolean;
  docs: boolean;
  todos: boolean;
  activity: boolean;
}

export interface ExportPayload {
  version: number;
  exportDate: string;
  data: {
    settings?: AppSettings[];
    notes?: Note[];
    docs?: Doc[];
    todos?: Todo[];
    todoLists?: TodoList[];
    activity?: ActivityEntry[];
    folders?: Folder[];
  };
}

export async function exportData(options: ExportOptions) {
  const exportPayload: ExportPayload = {
    version: 7, // Current database schema version
    exportDate: new Date().toISOString(),
    data: {},
  };

  try {
    if (options.settings) {
      exportPayload.data.settings = await db.settings.toArray();
    }
    if (options.notes) {
      exportPayload.data.notes = await db.notes.toArray();
    }
    if (options.docs) {
      exportPayload.data.docs = await db.docs.toArray();
    }
    if (options.todos) {
      exportPayload.data.todos = await db.todos.toArray();
      exportPayload.data.todoLists = await db.todoLists.toArray();
    }
    if (options.activity) {
      exportPayload.data.activity = await db.activity.toArray();
    }

    // Always include folders if notes, docs, or todos are selected
    if (options.notes || options.docs || options.todos) {
      exportPayload.data.folders = await db.folders.toArray();
    }

    const jsonString = JSON.stringify(exportPayload, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.style.display = "none";
    link.href = url;
    const [dateStr] = new Date().toISOString().split("T");
    link.setAttribute("download", `rosejournal_backup_${dateStr}.json`);

    // Append to body, click, and clean up
    document.body.appendChild(link);
    link.click();

    // Cleanup with a longer delay to ensure browser has time to start the download
    setTimeout(() => {
      document.body.removeChild(link);
      globalThis.URL.revokeObjectURL(url);
    }, 1000);

    return true;
  } catch (error) {
    console.error("Export failed:", error);
    throw error;
  }
}
