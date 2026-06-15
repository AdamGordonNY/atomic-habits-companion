"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { ChecklistRecord } from "@/types/checklist";

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
  templateType: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}): ChecklistRecord {
  return {
    id: row.id,
    title: row.title,
    templateType: row.templateType,
    content: JSON.parse(row.content),
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

export async function actionCreateChecklist(
  title = "Habit Assessment Checklist",
  templateType = "habit-assessment",
): Promise<ChecklistRecord> {
  const userId = await requireUserId();
  const row = await prisma.checklist.create({
    data: { userId, title, templateType, content: "[]" },
  });
  return rowToRecord(row);
}

export async function actionUpdateChecklist(
  id: string,
  data: { title?: string; content?: ChecklistRecord["content"] },
): Promise<ChecklistRecord> {
  const userId = await requireUserId();
  const row = await prisma.checklist.update({
    where: { id, userId },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.content !== undefined ? { content: JSON.stringify(data.content) } : {}),
    },
  });
  return rowToRecord(row);
}

export async function actionDeleteChecklist(id: string): Promise<void> {
  const userId = await requireUserId();
  await prisma.checklist.delete({ where: { id, userId } });
}
