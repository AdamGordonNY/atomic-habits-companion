import type { Metadata } from "next";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export const metadata: Metadata = {
  title: "Dashboard · Atomic Habits Companion",
  description: "Your habit assessment dashboard and progress overview.",
};

export default function DashboardPage() {
  return <DashboardClient />;
}
