// src/utils/formatDueDate.ts

export type DueUrgency = "overdue" | "today" | "tomorrow" | "soon";

export interface FormattedDueDate {
  label: string;
  urgency: DueUrgency;
  isOverdue: boolean;
}

export function formatDueDate(timestamp: number, now = Date.now()): FormattedDueDate {
  const target = new Date(timestamp);
  const current = new Date(now);

  // Compare calendar days at midnight in local time
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const today = new Date(current.getFullYear(), current.getMonth(), current.getDate()).getTime();
  const oneDay = 24 * 60 * 60 * 1000;

  const diffDays = Math.round((targetDay - today) / oneDay);

  if (diffDays < 0) {
    return { label: "Overdue", urgency: "overdue", isOverdue: true };
  }
  if (diffDays === 0) {
    return { label: "Today", urgency: "today", isOverdue: false };
  }
  if (diffDays === 1) {
    return { label: "Tomorrow", urgency: "tomorrow", isOverdue: false };
  }

  const label = target.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  return { label, urgency: "soon", isOverdue: false };
}
