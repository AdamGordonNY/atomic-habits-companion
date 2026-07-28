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
  name: string;           // e.g. "Reading Log"
  description?: string;
  icon?: string;          // emoji or icon name
  fields: CustomField[];  // the form definition
  createdAt: string;
  updatedAt: string;
}

export interface CustomEntryRecord {
  id: string;
  templateId: string;
  values: Record<string, string>; // fieldId → value
  createdAt: string;
}

// Extend ChecklistRecord to support both modes
export type ChecklistMode = "habit-assessment" | "custom";

export interface ChecklistRecord {
  id: string;
  title: string;
  templateType: "habit-assessment" | "custom"; // existing field
  mode: ChecklistMode;                      // NEW
  templateId?: string;                      // NEW — links to a ChecklistTemplate
  content: ChecklistHabitEntry[];           // existing habit mode
  customEntries: CustomEntryRecord[];       // NEW — custom mode entries
  createdAt: string;
  updatedAt: string;
}
