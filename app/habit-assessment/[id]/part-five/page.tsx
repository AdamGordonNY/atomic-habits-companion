import type { Metadata } from "next";
import { AssessmentNextStepForm } from "@/components/habit-assessment/assessment-next-step-form";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Part Five · The Next Step · ${id}`,
    description: "Turn your goals into systems and component habits.",
  };
}

export default async function PartFivePage({ params }: PageProps) {
  const { id } = await params;
  return <AssessmentNextStepForm assessmentId={id} />;
}
