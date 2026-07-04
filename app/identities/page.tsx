import type { Metadata } from "next";
import { IdentitiesSection } from "@/components/profile/profile-sections";
import { fetchIdentitiesData } from "@/lib/profile-data";

export const metadata: Metadata = {
  title: "Identities · Atomic Habits Companion",
  description: "SSR view of your identity entries.",
};

export default async function IdentitiesPage() {
  const { data } = await fetchIdentitiesData();
  return <div className="mx-auto max-w-3xl px-5 py-8"><IdentitiesSection data={data} showRouteLink={false} /></div>;
}