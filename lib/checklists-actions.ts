"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { ChecklistRecord, ChecklistTemplate, CustomField } from "@/types/checklist";
import { randomUUID } from "crypto";

// ─── auth ─────────────────────────────────────────────────────────────────────

async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function rowToRecord(row: {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  mode?: string | null;
  habitId?: string | null;
  templateId?: string | null;
  customEntries?: string | null;
}): ChecklistRecord {
  return {
    id: row.id,
    title: row.title,
    mode: (row.mode as ChecklistRecord["mode"]) ?? "habit-assessment",
    habitId: row.habitId ?? undefined,
    templateId: row.templateId ?? undefined,
    content: JSON.parse(row.content),
    customEntries: row.customEntries ? JSON.parse(row.customEntries) : {},
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
function templateRowToRecord(row: {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  fields: string;
  createdAt: Date;
  updatedAt: Date;
}): ChecklistTemplate {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    icon: row.icon ?? undefined,
    fields: JSON.parse(row.fields),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
// ─── actions ──────────────────────────────────────────────────────────────────

export async function actionGetChecklists(): Promise<ChecklistRecord[]> {
  const userId = await requireUserId();
  const rows = await prisma.checklist.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(rowToRecord);
}

export async function actionGetChecklist(id: string): Promise<ChecklistRecord | null> {
  const userId = await requireUserId();
  const row = await prisma.checklist.findFirst({ where: { id, userId } });
  return row ? rowToRecord(row) : null;
}

export async function actionCreateChecklist({
  title,
  templateId,
}: {
  title?: string;
  templateId?: string;
} = {}): Promise<ChecklistRecord> {
  const userId = await requireUserId();
   let resolvedTitle = title;
  let resolvedMode: ChecklistRecord["mode"] = "habit-assessment";
    if (templateId) {
    const template = await prisma.checklistTemplate.findFirst({
      where: { id: templateId, userId },
      select: { name: true },
    });
    if (!template) throw new Error("Template not found");
    resolvedMode = "custom";
    resolvedTitle ??= template.name;
  } else {
    resolvedTitle ??= "Habit Assessment Checklist";
  }
  const row = await prisma.checklist.create({
    data: {
      userId,
      title: resolvedTitle,
      mode: resolvedMode,
      templateId: templateId ?? null,
      content: "[]",
      customEntries: "{}",
    },
  });
  return rowToRecord(row);
}

export async function actionCreateHabitChecklist(
  habitId: string,
  title: string,
): Promise<ChecklistRecord> {
  const userId = await requireUserId();
  const row = await prisma.checklist.create({
    data: {
      userId,
      title,
      mode: "habit-assessment",
      habitId,
      content: "[]",
      customEntries: "{}",
    },
  });
  return rowToRecord(row);
}

export async function actionGetHabitChecklists(
  habitId: string,
  habitName?: string,
): Promise<ChecklistRecord[]> {
  const userId = await requireUserId();
  const rows = await prisma.checklist.findMany({
    where: {
      userId,
      OR: [
        { habitId },
        ...(habitName
          ? [{ title: { contains: habitName, mode: "insensitive" as const } }]
          : []),
      ],
    },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(rowToRecord);
}


export async function actionUpdateChecklist(
  id: string,
  data: {
    title?: string;
    content?: ChecklistRecord["content"];
    customEntries?: ChecklistRecord["customEntries"];
  },
): Promise<ChecklistRecord> {
  const userId = await requireUserId();
  const row = await prisma.checklist.update({
    where: { id, userId },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.content !== undefined ? { content: JSON.stringify(data.content) } : {}),
      ...(data.customEntries !== undefined
        ? { customEntries: JSON.stringify(data.customEntries) }
        : {}),
    },
  });
  return rowToRecord(row);
}

export async function actionDeleteChecklist(id: string): Promise<void> {
  const userId = await requireUserId();
  await prisma.checklist.delete({ where: { id, userId } });
}
export async function actionGetTemplates(): Promise<ChecklistTemplate[]> {
  const userId = await requireUserId();
  const rows = await prisma.checklistTemplate.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(templateRowToRecord);
}

export async function actionGetTemplate(id: string): Promise<ChecklistTemplate | null> {
  const userId = await requireUserId();
  const row = await prisma.checklistTemplate.findFirst({ where: { id, userId } });
  return row ? templateRowToRecord(row) : null;
}

export async function actionCreateTemplate(data: {
  name: string;
  description?: string;
  icon?: string;
  fields: CustomField[];
}): Promise<ChecklistTemplate> {
  const userId = await requireUserId();

  // Stamp each field with a stable id if one wasn't provided
  const fields: CustomField[] = data.fields.map((f) => ({
    ...f,
    id: f.id || randomUUID(),
  }));

  const row = await prisma.checklistTemplate.create({
    data: {
      userId,
      name: data.name,
      description: data.description ?? null,
      icon: data.icon ?? null,
      fields: JSON.stringify(fields),
    },
  });
  return templateRowToRecord(row);
}

export async function actionUpdateTemplate(
  id: string,
  data: {
    name?: string;
    description?: string;
    icon?: string;
    fields?: CustomField[];
  },
): Promise<ChecklistTemplate> {
  const userId = await requireUserId();
  const row = await prisma.checklistTemplate.update({
    where: { id, userId },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.icon !== undefined ? { icon: data.icon } : {}),
      ...(data.fields !== undefined ? { fields: JSON.stringify(data.fields) } : {}),
    },
  });
  return templateRowToRecord(row);
}

export async function actionDeleteTemplate(id: string): Promise<void> {
  const userId = await requireUserId();
  await prisma.checklistTemplate.delete({ where: { id, userId } });
}

export async function actionGetTemplateById(
  id: string,
): Promise<ChecklistTemplate | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const row = await prisma.checklistTemplate.findFirst({
    where: { id, userId },
  });

  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    icon: row.icon ?? undefined,
    description: row.description ?? undefined,
    fields: (
      typeof row.fields === "string"
        ? JSON.parse(row.fields)
        : row.fields
    ) as CustomField[],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

