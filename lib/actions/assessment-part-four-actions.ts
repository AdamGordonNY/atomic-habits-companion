"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { DomainVision, HabitAssessmentPartFour, IdentityEntry } from "@/types/habit";

async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

export async function fetchPartFour(): Promise<HabitAssessmentPartFour | null> {
  const userId = await requireUserId();

  const row = await prisma.assessmentPartFour.findUnique({
    where: { userId },
    include: { domainVisions: true, identities: true },
  });

  if (!row) return null;

  return {
    id: row.id,
    updatedAt: row.updatedAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,

    existingCommitments: row.existingCommitments,
    desiredCommitments: row.desiredCommitments,
    unwantedCommitments: row.unwantedCommitments,
    idealMorning: row.idealMorning,
    idealAfternoon: row.idealAfternoon,
    idealEvening: row.idealEvening,
    cleanSlateReflection: row.cleanSlateReflection,

    majorGoals: row.majorGoals,
    vision6Months: row.vision6Months,
    vision2Years: row.vision2Years,
    vision5Years: row.vision5Years,
    majorChanges: row.majorChanges,
    successDefinition: row.successDefinition,
    domainVisions: row.domainVisions.map((d) => ({ domain: d.domain, vision: d.vision })),
    identities: row.identities.map((identity) => ({
      id: identity.id,
      identity: identity.identity,
      habits: identity.habits,
      category: identity.category,
    })),
    futureReflection: row.futureReflection,
    reflectionGoals: row.reflectionGoals,
  };
}

export interface PartFourPayload {
  existingCommitments?: string[];
  desiredCommitments?: string[];
  unwantedCommitments?: string[];
  idealMorning?: string;
  idealAfternoon?: string;
  idealEvening?: string;
  cleanSlateReflection?: string;
  majorGoals?: string[];
  vision6Months?: string;
  vision2Years?: string;
  vision5Years?: string;
  majorChanges?: string[];
  successDefinition?: string;
  domainVisions?: DomainVision[];
  identities?: IdentityEntry[];
  futureReflection?: string;
  reflectionGoals?: string[];
  completedAt?: string | null;
}

export async function upsertPartFour(data: PartFourPayload): Promise<void> {
  const userId = await requireUserId();

  const existing = await prisma.assessmentPartFour.findUnique({
    where: { userId },
    select: { completedAt: true },
  });

  if (existing?.completedAt) {
    throw new Error("This assessment is complete and can no longer be edited.");
  }

  const scalar = {
    existingCommitments: data.existingCommitments ?? [],
    desiredCommitments: data.desiredCommitments ?? [],
    unwantedCommitments: data.unwantedCommitments ?? [],
    idealMorning: data.idealMorning ?? "",
    idealAfternoon: data.idealAfternoon ?? "",
    idealEvening: data.idealEvening ?? "",
    cleanSlateReflection: data.cleanSlateReflection ?? "",
    majorGoals: data.majorGoals ?? [],
    vision6Months: data.vision6Months ?? "",
    vision2Years: data.vision2Years ?? "",
    vision5Years: data.vision5Years ?? "",
    majorChanges: data.majorChanges ?? [],
    successDefinition: data.successDefinition ?? "",
    futureReflection: data.futureReflection ?? "",
    reflectionGoals: data.reflectionGoals ?? [],
    completedAt: data.completedAt ? new Date(data.completedAt) : null,
  };

  const record = await prisma.assessmentPartFour.upsert({
    where: { userId },
    create: { userId, ...scalar },
    update: scalar,
  });

  if (data.domainVisions !== undefined) {
    await prisma.domainVisionEntry.deleteMany({ where: { assessmentId: record.id } });
    if (data.domainVisions.length > 0) {
      await prisma.domainVisionEntry.createMany({
        data: data.domainVisions.map((vision) => ({
          domain: vision.domain,
          vision: vision.vision,
          assessmentId: record.id,
        })),
      });
    }
  }

  if (data.identities !== undefined) {
    const existingIdentities = await prisma.identityRecord.findMany({
      where: { assessmentId: record.id },
      select: { id: true },
    });
    const existingIds = new Set(existingIdentities.map((row) => row.id));
    const retainedIds = new Set(data.identities.map((entry) => entry.id).filter((id): id is string => Boolean(id)));
    const deleteIds = [...existingIds].filter((id) => !retainedIds.has(id));

    await prisma.$transaction(async (tx) => {
      if (deleteIds.length > 0) {
        await tx.identityRecord.deleteMany({ where: { id: { in: deleteIds } } });
      }

      for (const entry of data.identities!) {
        if (entry.id && existingIds.has(entry.id)) {
          await tx.identityRecord.update({
            where: { id: entry.id },
            data: {
              identity: entry.identity,
              habits: entry.habits,
            },
          });
          continue;
        }

        await tx.identityRecord.create({
          data: {
            identity: entry.identity,
            habits: entry.habits,
            assessmentId: record.id,
          },
        });
      }
    });
  }
}
