import type { Metadata } from "next";
import { NoteReadPage } from "@/components/notes/note-read-page";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Note ${id} · Atomic Habits Companion`,
    description: "View a saved note.",
  };
}

export default async function NotePage({ params }: PageProps) {
  const { id } = await params;
  return <NoteReadPage noteId={id} />;
}
