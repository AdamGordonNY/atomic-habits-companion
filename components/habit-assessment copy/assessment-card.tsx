import type { ReactNode } from "react";

interface AssessmentCardProps {
  step: number;
  totalSteps: number;
  title: string;
  description?: string;
  category: string;
  children: ReactNode;
  onBack: () => void;
  onNext: () => void;
  backDisabled?: boolean;
  nextDisabled?: boolean;
  nextLabel?: string;
  footerNote?: string;
}

export function AssessmentCard({
  step,
  totalSteps,
  title,
  description,
  category,
  children,
  onBack,
  onNext,
  backDisabled,
  nextDisabled,
  nextLabel = "Continue",
  footerNote,
}: AssessmentCardProps) {
  const progress = Math.max(0, Math.min(100, (step / totalSteps) * 100));

  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/15 bg-white/80 shadow-[0_30px_100px_rgba(15,23,42,0.12)] backdrop-blur-xl">
      <div className="h-1.5 w-full bg-slate-200/70">
        <div
          className="h-full rounded-r-full bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-400 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="p-6 sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {category}
          </span>
          <span className="text-sm font-medium text-slate-500">
            {step} / {totalSteps}
          </span>
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            {title}
          </h2>
          {description ? (
            <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              {description}
            </p>
          ) : null}
        </div>

        <div className="mt-8">{children}</div>

        <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-500">{footerNote}</div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onBack}
              disabled={backDisabled}
              className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
            >
              Back
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={nextDisabled}
              className="inline-flex h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
            >
              {nextLabel}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}