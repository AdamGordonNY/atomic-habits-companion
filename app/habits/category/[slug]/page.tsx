import type { Metadata } from "next";
import { HabitCategoryPage } from "@/components/habits/habit-category-page";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = decodeURIComponent(slug);
  return {
    title: `${category} · Habits · Atomic Habits Companion`,
    description: `All tracked habits in the "${category}" category.`,
  };
}

export default async function HabitCategoryRoute({ params }: PageProps) {
  const { slug } = await params;
  const category = decodeURIComponent(slug);
  return <HabitCategoryPage category={category} />;
}
