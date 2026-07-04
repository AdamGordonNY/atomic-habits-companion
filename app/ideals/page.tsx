import type { Metadata } from "next";
import { IdealsSection } from "@/components/profile/profile-sections";
import { fetchIdealsData } from "@/lib/profile-data";

export const metadata: Metadata = {
  title: "Ideals · Atomic Habits Companion",
  description: "SSR view of your ideal routines.",
};

export default async function IdealsPage() {
  const { data } = await fetchIdealsData();
  return <div className="mx-auto max-w-3xl px-5 py-8"><IdealsSection data={data} showRouteLink={false} /></div>;
}