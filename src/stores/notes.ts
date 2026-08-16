// src/stores/notes.ts
import { defineStore } from "pinia";
import { ref } from "vue";
import db from "@/db";
import type { Note } from "@/db/types";
import { useActivityStore } from "./activity";

const DEFAULT_BACKGROUND = "#ffffff";

export const useNotesStore = defineStore("notes", () => {
  const notes = ref<Note[]>([]);

  async function loadNotes() {
    notes.value = await db.notes.toArray();
  }

  async function createNote(title: string, folderId: string | null) {
    const trimmed = title.trim() || "Untitled";
    const duplicate = notes.value.find(
      (note) => note.folderId === folderId && note.title.toLowerCase() === trimmed.toLowerCase(),
    );
    if (duplicate) {
      throw new Error(`A note named "${trimmed}" already exists here.`);
    }
    const now = Date.now();
    const note: Note = {
      backgroundColor: DEFAULT_BACKGROUND,
      backgroundPattern: "solid",
      canvasJSON: null,
      createdAt: now,
      folderId,
      id: crypto.randomUUID(),
      lastOpenedAt: null,
      thumbnail: null,
      title: trimmed,
      updatedAt: now,
    };
    await db.notes.add(note);
    await useActivityStore().record("note_created", note.id);
    await loadNotes();
    return note.id;
  }

  async function getNote(id: string): Promise<Note | undefined> {
    return db.notes.get(id);
  }

  // Marks a note as opened "now" — powers Home's "recently opened" sort.
  async function touchNote(id: string) {
    await db.notes.update(id, { lastOpenedAt: Date.now() });
  }

  async function updateNote(
    id: string,
    changes: Partial<Pick<Note, "title" | "canvasJSON" | "backgroundColor" | "backgroundPattern" | "thumbnail">>,
  ) {
    const sanitized = { ...changes };
    if ("canvasJSON" in changes) {
      sanitized.canvasJSON = changes.canvasJSON ? structuredClone(changes.canvasJSON) : null;
    }
    await db.notes.update(id, { ...sanitized, updatedAt: Date.now() });
    if ("canvasJSON" in changes) {
      await useActivityStore().record("note_updated", id);
    }
  }

  async function deleteNote(id: string) {
    await db.notes.delete(id);
    await loadNotes();
  }

  async function deleteNotesByFolder(folderId: string) {
    const targets = await db.notes.where("folderId").equals(folderId).toArray();
    await db.notes.bulkDelete(targets.map((note) => note.id));
  }

  return {
    createNote,
    deleteNote,
    deleteNotesByFolder,
    getNote,
    loadNotes,
    notes,
    touchNote,
    updateNote,
  };
});
