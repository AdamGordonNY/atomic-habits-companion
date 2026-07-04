import type { Metadata } from "next";
import { CommitmentsSection } from "@/components/profile/profile-sections";
import { fetchCommitmentsData } from "@/lib/profile-data";

export const metadata: Metadata = {
  title: "Commitments · Atomic Habits Companion",
  description: "SSR view of commitments from your profile.",
};

export default async function CommittmentsPage() {
  const { data } = await fetchCommitmentsData();
  return <div className="mx-auto max-w-3xl px-5 py-8"><CommitmentsSection data={data} showRouteLink={false} /></div>;
}