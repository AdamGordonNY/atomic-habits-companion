import type { Metadata } from "next";
import { AssessmentPartFourForm } from "@/components/habit-assessment/assessment-part-four-form";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Habit Assessment Part Four · ${id}`,
    description: "Design your ideal life — where do you want to end up?",
  };
}

export default async function HabitAssessmentPartFourPage({ params }: PageProps) {
  const { id } = await params;
  return <AssessmentPartFourForm assessmentId={id} />;
}
