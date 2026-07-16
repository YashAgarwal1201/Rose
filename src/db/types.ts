// Src/db/types.ts

export type FeatureType = "todo" | "note" | "doc";

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  type: FeatureType;
  createdAt: number;
  updatedAt: number;
}

export interface TodoList {
  id: string;
  folderId: string | null;
  name: string;
  createdAt: number;
  updatedAt: number;
}

export interface Todo {
  id: string;
  listId: string;
  title: string;
  done: boolean;
  priority: "low" | "medium" | "high" | null;
  dueDate: number | null;
  createdAt: number;
  updatedAt: number;
}
