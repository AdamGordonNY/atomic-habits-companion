import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { actionGetTemplates } from "@/lib/checklists-actions";
import { TemplatesClient } from "@/components/checklists/templates-client";

export default async function TemplatesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const templates = await actionGetTemplates();

  return <TemplatesClient initialTemplates={templates} />;
}
