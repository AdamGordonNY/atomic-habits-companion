import type { Metadata } from "next";
import { LawShell } from "@/components/laws/law-shell";

export const metadata: Metadata = {
  title: "Law 1 · Make it Obvious/Invisible",
};

export default function LawOnePage() {
  return (
    <LawShell>
      <div className="max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Law 1: Make it Obvious/Invisible</h1>
        <p className="mt-2 text-sm text-slate-600">This page is ready for upcoming Law 1 modules.</p>
      </div>
    </LawShell>
  );
}
