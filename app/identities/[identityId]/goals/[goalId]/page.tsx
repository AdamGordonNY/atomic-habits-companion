import { GoalPage } from "@/components/goals/goal-page";


type PageProps = { params: Promise<{ identityId: string; goalId: string }> };

export default async function IdentityGoalDetailPage({ params }: PageProps) {
  const { identityId, goalId } = await params;

  return (
    <GoalPage
      goalId={goalId}
      parentHref={`/identities/${identityId}`}
      parentLabel="Identity"
    />
  //     return (
  //   <div className="mx-auto max-w-4xl space-y-6 px-5 py-8">
  //     <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
  //       <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Goal</p>
  //       <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{goal.goal || "Untitled goal"}</h1>
  //       <p className="mt-2 text-sm text-slate-600">
  //         Identity: <Link href={`/identities/${identityId}`} className="font-medium text-slate-800 hover:text-slate-900">{goal.identity?.identity || "Unknown"}</Link>
  //       </p>
  //     </header>

  //     <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
  //       <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">Identity</h2>
  //       {assignableIdentities.length > 0 && (
  //         <form action={attachIdentityAction} className="mt-3 flex flex-col gap-2 sm:flex-row">
  //           <select
  //             name="identityId"
  //             defaultValue=""
  //             className="h-10 min-w-0 flex-1 rounded-full border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
  //           >
  //             <option value="" disabled>
  //               Attach goal to an identity…
  //             </option>
  //             {assignableIdentities.map((identityOption) => (
  //               <option key={identityOption.id} value={identityOption.id}>
  //                 {identityOption.identity}
  //               </option>
  //             ))}
  //           </select>
  //           <button
  //             type="submit"
  //             className="inline-flex h-10 items-center justify-center rounded-full bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800"
  //           >
  //             Attach
  //           </button>
  //         </form>
  //       )}
  //     </section>

  //     <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
  //       <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
  //         <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">Habits For This Goal</h2>
  //         <Link
  //           href="/habits/new"
  //           className="inline-flex h-8 items-center rounded-full border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:border-slate-400 hover:text-slate-900"
  //         >
  //           + New habit
  //         </Link>
  //       </div>
  //       {assignableHabits.length > 0 && (
  //         <form action={attachHabitAction} className="mt-3 flex flex-col gap-2 sm:flex-row">
  //           <select
  //             name="habitId"
  //             defaultValue=""
  //             className="h-10 min-w-0 flex-1 rounded-full border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
  //           >
  //             <option value="" disabled>
  //               Attach habit to this goal…
  //             </option>
  //             {assignableHabits.map((habit) => (
  //               <option key={habit.id} value={habit.id}>
  //                 {habit.name}{habit.category ? ` (${habit.category})` : ""}
  //               </option>
  //             ))}
  //           </select>
  //           <button
  //             type="submit"
  //             className="inline-flex h-10 items-center justify-center rounded-full bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800"
  //           >
  //             Attach
  //           </button>
  //         </form>
  //       )}
  //       {goal.trackedHabits.length === 0 ? (
  //         <p className="mt-3 text-sm text-slate-500">No habits attached to this goal yet.</p>
  //       ) : (
  //         <div className="mt-3 space-y-2">
  //           {goal.trackedHabits.map((habit) => (
  //             <Link
  //               key={habit.id}
  //               href={`/identities/${identityId}/goals/${goal.id}/habits/${habit.id}`}
  //               className="block rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 hover:border-slate-300 hover:text-slate-900"
  //             >
  //               {habit.name}
  //             </Link>
  //           ))}
  //         </div>
  //       )}
  //     </section>
  //   </div>
  // );
  );








}
