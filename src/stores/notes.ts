// src/stores/notes.ts
import { defineStore } from "pinia";
import { ref } from "vue";
import db from "@/db";
import type { Note } from "@/db/types";
import { useActivityStore } from "./activity";

const DEFAULT_BACKGROUND = "#ffffff";

import { useFoldersStore } from "./folders";
import { useVaultStore } from "./vault";
import { encryptJSONField, decryptJSONField, encryptField, decryptField } from "@/utils/crypto";

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
    let isVaulted = false;
    if (folderId) {
      const folder = await db.folders.get(folderId);
      isVaulted = folder?.isVaulted ?? false;
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
      isVaulted,
      iv: null,
    };
    await db.notes.add(note);
    await useActivityStore().record("note_created", note.id);
    if (folderId) {
      await useFoldersStore().ensureFolderSupports(folderId, "note");
    }
    await loadNotes();
    return note.id;
  }

  async function getNote(id: string): Promise<Note | undefined> {
    const note = await db.notes.get(id);
    if (!note) {return;}
    if (note.isVaulted) {
      const vault = useVaultStore();
      if (!vault.derivedKey) {throw new Error("Vault is locked");}
      if (note.canvasJSON) {await decryptJSONField(vault.derivedKey, note, "canvasJSON");}
      if (note.thumbnail) {await decryptField(vault.derivedKey, note, "thumbnail");}
    }
    return note;
  }

  // Marks a note as opened "now" — powers Home's "recently opened" sort.
  async function touchNote(id: string) {
    await db.notes.update(id, { lastOpenedAt: Date.now() });
  }

  async function updateNote(
    id: string,
    changes: Partial<Pick<Note, "title" | "canvasJSON" | "backgroundColor" | "backgroundPattern" | "thumbnail">>,
  ) {
    const sanitized: Partial<Note> = { ...changes, updatedAt: Date.now() };
    if ("canvasJSON" in changes) {
      sanitized.canvasJSON = changes.canvasJSON ? structuredClone(changes.canvasJSON) : null;
    }

    const note = await db.notes.get(id);
    if (note?.isVaulted) {
      const vault = useVaultStore();
      if (!vault.derivedKey) {throw new Error("Vault is locked");}
      if ("canvasJSON" in sanitized && sanitized.canvasJSON) {
        await encryptJSONField(vault.derivedKey, sanitized as Partial<Note> & { iv: string | null }, "canvasJSON");
      }
      if ("thumbnail" in sanitized && sanitized.thumbnail) {
        await encryptField(vault.derivedKey, sanitized as Partial<Note> & { iv: string | null }, "thumbnail");
      }
    }

    await db.notes.update(id, sanitized);
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

  async function moveNote(id: string, newFolderId: string | null, newTitle?: string) {
    const target = notes.value.find((note) => note.id === id);
    if (!target) {
      return;
    }

    if (target.folderId === newFolderId && (!newTitle || newTitle.trim() === target.title)) {
      return;
    }

    const titleToUse = (newTitle || target.title).trim();
    const duplicate = notes.value.find(
      (note) =>
        note.id !== id &&
        note.folderId === newFolderId &&
        note.title.toLowerCase() === titleToUse.toLowerCase(),
    );
    if (duplicate) {
      throw new Error(`A note named "${titleToUse}" already exists in the destination.`);
    }

    let newIsVaulted = false;
    if (newFolderId) {
      const parent = await db.folders.get(newFolderId);
      newIsVaulted = parent?.isVaulted ?? false;
    }

    const updatePayload: Partial<Note> = {
      folderId: newFolderId,
      title: titleToUse,
      updatedAt: Date.now(),
      isVaulted: newIsVaulted
    };

    const dbNote = await db.notes.get(id);
    if (dbNote && dbNote.isVaulted !== newIsVaulted) {
      const vault = useVaultStore();
      if (!vault.derivedKey) {throw new Error("Vault is locked");}

      if (newIsVaulted) {
        if (dbNote.canvasJSON) {
          await encryptJSONField(vault.derivedKey, dbNote, "canvasJSON");
          updatePayload.canvasJSON = dbNote.canvasJSON;
        }
        if (dbNote.thumbnail) {
          await encryptField(vault.derivedKey, dbNote, "thumbnail");
          updatePayload.thumbnail = dbNote.thumbnail;
        }
        updatePayload.iv = dbNote.iv;
      } else {
        if (dbNote.canvasJSON) {
          await decryptJSONField(vault.derivedKey, dbNote, "canvasJSON");
          updatePayload.canvasJSON = dbNote.canvasJSON;
        }
        if (dbNote.thumbnail) {
          await decryptField(vault.derivedKey, dbNote, "thumbnail");
          updatePayload.thumbnail = dbNote.thumbnail;
        }
        updatePayload.iv = null;
      }
    }

    await db.notes.update(id, updatePayload);
    if (newFolderId) {
      await useFoldersStore().ensureFolderSupports(newFolderId, "note");
    }
    await loadNotes();
  }

  return {
    createNote,
    deleteNote,
    deleteNotesByFolder,
    getNote,
    loadNotes,
    moveNote,
    notes,
    touchNote,
    updateNote,
  };
});

