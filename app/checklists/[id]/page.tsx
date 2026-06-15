import type { Metadata } from "next";
import { ChecklistEditor } from "@/components/checklists/checklist-editor";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Checklist · ${id}`,
    description: "Fill in your habit assessment checklist.",
  };
}

export default async function ChecklistPage({ params }: PageProps) {
  const { id } = await params;
  return <ChecklistEditor checklistId={id} />;
}
