import Link from "next/link";

export default function BentoCard({
  href, icon, label, sublabel, accent = false, wide = false,
}: {
  href: string; icon: string; label: string; sublabel?: string; accent?: boolean; wide?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group flex flex-col justify-between gap-4 rounded-[1.5rem] border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 ${wide ? "sm:col-span-2" : ""} ${accent ? "border-slate-800 bg-slate-950 text-white hover:border-slate-700 hover:bg-slate-900" : "border-slate-200 bg-white hover:border-slate-300"}`}
    >
      <span className="text-2xl">{icon}</span>
      <div>
        <p className={`text-sm font-semibold ${accent ? "text-white" : "text-slate-950"}`}>{label}</p>
        {sublabel && <p className={`mt-0.5 text-xs ${accent ? "text-slate-400" : "text-slate-500"}`}>{sublabel}</p>}
      </div>
    </Link>
  );
}