import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-[calc(100vh-1px)] items-center justify-center px-6 py-12">
      <section className="w-full max-w-4xl rounded-[2rem] border border-white/10 bg-white/75 p-8 shadow-[0_30px_100px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-12">
        <div className="max-w-2xl space-y-6">
          <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Atomic Habits Companion
          </span>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
              Start with a focused habit assessment.
            </h1>
            <p className="max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              Capture your personal and professional satisfaction, priorities,
              projects, obligations, and the changes you want to make in one
              guided flow.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/habit-assessment/onboarding"
              className="inline-flex h-12 items-center justify-center rounded-full bg-slate-950 px-6 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 hover:bg-slate-800"
            >
              Open assessment
            </Link>
            <div className="inline-flex h-12 items-center rounded-full border border-slate-200 bg-white px-6 text-sm text-slate-500">
              Answers persist in localStorage
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
