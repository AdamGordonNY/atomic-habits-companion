import type { Metadata } from "next";
import { AssessmentForm } from "@/components/habit-assessment/assessment-form";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;

  return {
    title: `Habit Assessment · ${id}`,
    description: "Guided onboarding habit assessment.",
  };
}

export default async function HabitAssessmentPage({ params }: PageProps) {
  const { id } = await params;

  return <AssessmentForm assessmentId={id} />;
}