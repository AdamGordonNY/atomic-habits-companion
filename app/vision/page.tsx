import type { Metadata } from "next";
import { VisionSection } from "@/components/profile/profile-sections";
import { fetchVisionData } from "@/lib/profile-data";

export const metadata: Metadata = {
  title: "Vision · Atomic Habits Companion",
  description: "SSR view of your longer-term vision.",
};

export default async function VisionPage() {
  const { data } = await fetchVisionData();
  return <div className="mx-auto max-w-3xl px-5 py-8"><VisionSection data={data} showRouteLink={false} /></div>;
}