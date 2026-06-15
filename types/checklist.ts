// ─── Checklist types ──────────────────────────────────────────────────────────

export interface ChecklistObstacle {
  id: string;
  obstacle: string;
  plan: string;
}

export interface ChecklistHabitEntry {
  id: string;
  habit: string;
  howIsItGoing: string;
  identityReinforcement: string;
  victory: string;
  workingNotWorking: string;
  obstacles: ChecklistObstacle[];
  learnings: string;
}

export interface ChecklistRecord {
  id: string;
  title: string;
  templateType: string;
  content: ChecklistHabitEntry[];
  createdAt: string;
  updatedAt: string;
}
