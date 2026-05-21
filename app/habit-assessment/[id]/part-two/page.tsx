import type { Metadata } from "next";
import { AssessmentPartTwoForm } from "@/components/habit-assessment/assessment-part-two-form";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;

  return {
    title: `Habit Assessment Part Two · ${id}`,
    description: "7-day hour-by-hour activity and energy assessment.",
  };
}

export default async function HabitAssessmentPartTwoPage({ params }: PageProps) {
  const { id } = await params;

  return <AssessmentPartTwoForm assessmentId={id} />;
}