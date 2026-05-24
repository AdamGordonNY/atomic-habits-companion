import type { Metadata } from "next";
import { AssessmentReview } from "@/components/assessment-review/assessment-review";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Assessment Review · ${id}`,
    description: "Review all your assessment answers in one place.",
  };
}

export default async function AssessmentReviewPage({ params }: PageProps) {
  const { id } = await params;
  return <AssessmentReview assessmentId={id} />;
}
