import type { Metadata } from "next";
import { NotesClient } from "@/components/notes/notes-client";

export const metadata: Metadata = {
  title: "Notes · Atomic Habits Companion",
  description: "Write and collect short notes.",
};

export default function NotesPage() {
  return <NotesClient />;
}
