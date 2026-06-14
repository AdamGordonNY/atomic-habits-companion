import type { Metadata } from "next";
import { AssessmentNextStepForm } from "@/components/habit-assessment/assessment-next-step-form";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `The Next Step · ${id}`,
    description: "Turn your goals into systems and habits.",
  };
}

export default async function NextStepPage({ params }: PageProps) {
  const { id } = await params;
  return <AssessmentNextStepForm assessmentId={id} />;
}
