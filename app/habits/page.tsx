import type { Metadata } from "next";
import { HabitsSection } from "@/components/profile/profile-sections";
import { fetchHabitsData } from "@/lib/profile-data";

export const metadata: Metadata = {
  title: "Habits · Atomic Habits Companion",
  description: "SSR view of your tracked habits.",
};

export default async function HabitsPage() {
  const { data } = await fetchHabitsData();
  return <div className="mx-auto max-w-3xl px-5 py-8"><HabitsSection data={data} showRouteLink={false} /></div>;
}