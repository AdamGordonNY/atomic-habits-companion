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

export type FieldType = "text" | "textarea" | "rating" | "date" | "url";

export interface CustomField {
  id: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  fields: CustomField[];
  createdAt: string;
  updatedAt: string;
}

export type CustomEntryRecord = Record<string, string>;
export type ChecklistMode = "habit-assessment" | "custom";

export interface ChecklistRecord {
  id: string;
  title: string;
  mode: ChecklistMode;           // "templateType" removed — this is the single source of truth
  habitId?: string;              // NEW — links checklist to a specific habit
  templateId?: string;
  content: ChecklistHabitEntry[];
  customEntries: CustomEntryRecord;
  createdAt: string;
  updatedAt: string;
}