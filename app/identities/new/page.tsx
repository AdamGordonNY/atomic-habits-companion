import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "New Identity · Atomic Habits Companion",
  description: "Create a new identity and attach goals to it.",
};

function parseLines(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export default async function NewIdentityPage() {
  const createIdentity = async (formData: FormData) => {
    "use server";

    const { userId } = await auth();
    if (!userId) notFound();

    const identityName = String(formData.get("identity") ?? "").trim();
    if (!identityName) return;

    const goals = parseLines(formData.get("goals"));

    const identity = await prisma.identity.create({
      data: {
        userId,
        name: identityName,
        category: null,
      },
    });

    if (goals.length > 0) {
      await prisma.goal.createMany({
        data: goals.map((goal) => ({
          identityId: identity.id,
          text: goal,
          category: null,
          currentSystem: "",
          systemEval: "",
          systemRating: 0,
          idealSystem: "",
        })),
      });
    }

    revalidatePath("/identities");
    revalidatePath("/goals");
    revalidatePath("/profile");
    redirect(`/identities/${identity.id}`);
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Add New</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Create identity</h1>
        <p className="mt-2 text-sm text-slate-600">
          Add the identity first, then attach one or more goals on the same page.
        </p>

        <form action={createIdentity} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Identity</span>
            <input
              name="identity"
              placeholder="Who are you becoming?"
              className="mt-2 h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Goals</span>
            <textarea
              name="goals"
              rows={6}
              placeholder="One goal per line"
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
            />
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Create identity
            </button>
            <p className="text-xs text-slate-500">Goals will be attached to the identity you create.</p>
          </div>
        </form>
      </div>
    </div>
  );
}
