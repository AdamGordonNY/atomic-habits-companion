import type { Metadata } from "next";
import Link from "next/link";
import { SignInButtons } from "@/components/auth/sign-in-buttons";

export const metadata: Metadata = {
  title: "Sign in · Atomic Habits Companion",
};

export default function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-white px-4 py-16">
      <div className="w-full max-w-sm">
        {/* logo / wordmark */}
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400 hover:text-slate-600"
          >
            ← Atomic Habits
          </Link>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Your assessment data syncs to your account so you never lose progress.
          </p>
        </div>

        {/* sign-in card */}
        <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
          <div className="bg-slate-950 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Sign in / Create account
            </p>
            <p className="mt-1 text-sm text-white">
              One click — no password needed.
            </p>
          </div>

          <div className="px-6 py-6">
            <SignInButtons searchParams={searchParams} />
          </div>

          <div className="border-t border-slate-100 bg-slate-50/80 px-6 py-4 text-center">
            <p className="text-[11px] text-slate-400">
              By signing in you agree to keep your habits on track. 🌱
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Already have data?{" "}
          <span className="text-slate-600">
            Sign in and it syncs automatically.
          </span>
        </p>
      </div>
    </div>
  );
}
