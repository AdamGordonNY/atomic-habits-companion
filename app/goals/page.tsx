import type { Metadata } from "next";
import { GoalsSection } from "@/components/profile/profile-sections";
import { fetchGoalsData } from "@/lib/profile-data";

export const metadata: Metadata = {
  title: "Goals · Atomic Habits Companion",
  description: "SSR view of your profile goals.",
};

export default async function GoalsPage() {
  const { data } = await fetchGoalsData();
  return <div className="mx-auto max-w-3xl px-5 py-8"><GoalsSection data={data} showRouteLink={false} /></div>;
}
