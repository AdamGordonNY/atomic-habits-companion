import type { Metadata } from "next";
import { ChecklistsClient } from "@/components/checklists/checklists-client";

export const metadata: Metadata = {
  title: "Checklists · Atomic Habits Companion",
  description: "Track your habits with reusable, fillable checklists.",
};

export default function ChecklistsPage() {
  return <ChecklistsClient />;
}
