import type { Metadata } from "next";
import { AssessmentPartThreeForm } from "@/components/habit-assessment/assessment-part-three-form";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;

  return {
    title: `Habit Assessment Part Three · ${id}`,
    description: "Time, energy, and habit history deep-dive.",
  };
}

export default async function HabitAssessmentPartThreePage({ params }: PageProps) {
  const { id } = await params;

  return <AssessmentPartThreeForm assessmentId={id} />;
}
