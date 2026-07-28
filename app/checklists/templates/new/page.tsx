import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { TemplateBuilderClient } from "@/components/checklists/create-template";
import {type Metadata} from 'next';

export const metadata:Metadata = {
  title: "New Template",
};

export default async function NewTemplatePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return <TemplateBuilderClient />;
}
