export interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

export type Filter = "all" | "active" | "completed";

// Reads the filter from a location hash such as "#/active".
export function getFilter(hash: string): Filter {
  const filter = hash.slice(2);
  return filter === "active" || filter === "completed" ? filter : "all";
}

export function isVisible(todo: Todo, filter: Filter) {
  return filter === "all" || todo.completed === (filter === "completed");
}
