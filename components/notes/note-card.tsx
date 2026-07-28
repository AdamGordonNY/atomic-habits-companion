import { Note } from "@/types/habit";
import { formatRelative } from "./utils";
function excerpt(text: string, max = 100): string {
  const trimmed = text.trim();
  return trimmed.length > max ? trimmed.slice(0, max) + "…" : trimmed;
}
export default function NoteCard({
  note,
  active,
  onClick,
}: {
  note: Note;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border px-4 py-3.5 text-left transition-all ${
        active
          ? "border-slate-950 bg-slate-950 text-white shadow-md"
          : "border-slate-100 bg-white text-slate-900 hover:border-slate-200 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p
          className={`truncate text-sm font-semibold ${
            active ? "text-white" : "text-slate-950"
          }`}
        >
          {note.title || "Untitled note"}
        </p>
        <div className="flex flex-shrink-0 items-center gap-1">
          {note.pinned && (
            <span className={`text-xs ${active ? "text-slate-400" : "text-slate-400"}`}>
              📌
            </span>
          )}
          <span
            className={`text-[10px] ${active ? "text-slate-400" : "text-slate-400"}`}
          >
            {formatRelative(note.updatedAt)}
          </span>
        </div>
      </div>
      {note.contentText.trim() && (
        <p
          className={`mt-1 line-clamp-2 text-xs leading-5 ${
            active ? "text-slate-400" : "text-slate-500"
          }`}
        >
          {excerpt(note.contentText)}
        </p>
      )}
      {note.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {note.tags.slice(0, 3).map((t) => (
            <span
              key={t}
              className={`rounded-full px-2 py-0.5 text-[10px] ${
                active
                  ? "bg-slate-800 text-slate-300"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}