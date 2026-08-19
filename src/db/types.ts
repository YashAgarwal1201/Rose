// Src/db/types.ts

export type FeatureType = "todo" | "note" | "doc";

export type BackgroundPattern = "solid" | "dots" | "grid" | "ruled";

export type PenTool = "pencil" | "pen" | "marker";
export type ShapeTool = "rectangle" | "ellipse" | "line" | "arrow" | "triangle" | "diamond" | "star" | "hexagon" | "cloud" | "cylinder" | "parallelogram" | "rhombus" | "square" | "double-arrow";
export type CanvasTool = "select" | "pen" | "eraser" | "text" | "shape" | "image";

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  type: FeatureType | "mixed";
  createdAt: number;
  updatedAt: number;
}

export interface TodoList {
  id: string;
  folderId: string | null;
  name: string;
  createdAt: number;
  updatedAt: number;
  lastOpenedAt: number | null;
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

export interface Doc {
  id: string;
  folderId: string | null;
  title: string;
  contentJSON: Record<string, unknown> | null; // TipTap JSON output
  createdAt: number;
  updatedAt: number;
  lastOpenedAt: number | null;
}

export interface AppSettings {
  id: 1;
  username: string | null;
  onboardingCompleted: boolean;
  onboardingStep: number;
  showActivityChart?: boolean;
  createdAt: number;
}

export type ActivityAction =
  | "folder_created"
  | "todo_list_created"
  | "todo_created"
  | "todo_toggled"
  | "todo_updated"
  | "doc_created"
  | "doc_updated"
  | "note_created"
  | "note_updated";

export interface ActivityEntry {
  id: string;
  type: ActivityAction;
  entityId: string;
  timestamp: number;
}

export interface Note {
  id: string;
  folderId: string | null;
  title: string;
  canvasJSON: Record<string, unknown> | null; // fabric.Canvas.toJSON() output
  backgroundColor: string; // page background, independent of pen color
  backgroundPattern: BackgroundPattern;
  thumbnail: string | null; // Data URL for the grid previewcard
  createdAt: number;
  updatedAt: number;
  lastOpenedAt: number | null;
}
