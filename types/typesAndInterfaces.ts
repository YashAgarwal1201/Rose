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
