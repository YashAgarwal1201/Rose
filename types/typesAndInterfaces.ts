// Interfaces
export interface TodoItem {
  id: string;
  text: string;
  isDone: boolean;
  timestamp: Date;
}

export interface TodoList {
  id: string;
  title: string;
  timestamp: Date;
  isDone: boolean;
  list: TodoItem[];
}

export type ListOfTodos = TodoList[];

export type Folder = {
  id: string;
  name: string;
  documents: Document[];
  timestamp: Date;
  lastUpdatedTimestamp: Date;
};

export interface Document {
  id: string;
  timestamp: Date;
  lastUpdatedTimestamp: Date;
  title: string;
  content: string;
  folder: string;
  createdBy: string;
  lastModifiedBy: string;
  isStarred: boolean;
  isArchived: boolean;
}

export type ListOfDocuments = Document[];
