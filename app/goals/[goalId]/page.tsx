import type { Metadata } from "next";
import { GoalPage } from "@/components/goals/goal-page";

type PageProps = { params: Promise<{ goalId: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { goalId } = await params;
  return {
    title: `Goal ${goalId} · Atomic Habits Companion`,
    description: "Goal details and check-ins.",
  };
}

export default async function GoalRoute({ params }: PageProps) {
  const { goalId } = await params;
  return <GoalPage goalId={goalId} />;
}
