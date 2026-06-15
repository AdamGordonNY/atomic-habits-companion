import type { Metadata } from "next";
import { HabitTracker } from "@/components/habits/habit-tracker";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const name = decodeURIComponent(slug);
  return {
    title: `${name} · Habit Tracker · Atomic Habits Companion`,
    description: `Track your progress with: ${name}`,
  };
}

export default async function HabitPage({ params }: PageProps) {
  const { slug } = await params;
  const habitName = decodeURIComponent(slug);
  return <HabitTracker habitName={habitName} />;
}
