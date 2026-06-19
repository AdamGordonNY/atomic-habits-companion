import type { Metadata } from "next";
import { HabitTracker } from "@/components/habits/habit-tracker";
import { actionGetTrackedHabitById } from "@/lib/actions/habit-actions";

type PageProps = { params: Promise<{ habitId: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { habitId } = await params;
  const habit = await actionGetTrackedHabitById(habitId);
  const label = habit?.name ?? "Habit";

  return {
    title: `${label} · Habit Tracker · Atomic Habits Companion`,
    description: `Track your progress with: ${label}`,
  };
}

export default async function HabitPage({ params }: PageProps) {
  const { habitId } = await params;
  return <HabitTracker habitId={habitId} />;
}
