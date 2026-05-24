"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import { useEffect } from "react";

interface RichEditorProps {
  /** TipTap JSON string. Pass "" or undefined for a blank editor. */
  initialContent?: string;
  placeholder?: string;
  onChange?: (json: string, text: string) => void;
  /** When this key changes the editor content is reset to initialContent */
  resetKey?: string | number;
  readOnly?: boolean;
  minHeight?: string;
}

// ─── toolbar button ───────────────────────────────────────────────────────────

function ToolBtn({
  active,
  disabled,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs transition ${
        active
          ? "bg-slate-950 text-white"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
      } disabled:pointer-events-none disabled:opacity-30`}
    >
      {children}
    </button>
  );
}

// ─── component ───────────────────────────────────────────────────────────────

export function RichEditor({
  initialContent,
  placeholder = "Write something…",
  onChange,
  resetKey,
  readOnly = false,
  minHeight = "10rem",
}: RichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      CharacterCount,
    ],
    content: parseContent(initialContent),
    editable: !readOnly,
    onUpdate({ editor }) {
      onChange?.(JSON.stringify(editor.getJSON()), editor.getText());
    },
    editorProps: {
      attributes: {
        class: "outline-none",
      },
    },
  });

  // reset content when resetKey changes (new note, etc.)
  useEffect(() => {
    if (!editor) return;
    const parsed = parseContent(initialContent);
    editor.commands.setContent(parsed, { emitUpdate: false });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  if (!editor) return null;

  const words = editor.storage.characterCount?.words?.() ?? 0;

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-100">
      {/* toolbar */}
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-100 px-3 py-2">
          {/* text style */}
          <ToolBtn
            title="Bold"
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <strong>B</strong>
          </ToolBtn>
          <ToolBtn
            title="Italic"
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <em>I</em>
          </ToolBtn>
          <ToolBtn
            title="Strikethrough"
            active={editor.isActive("strike")}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <s>S</s>
          </ToolBtn>
          <ToolBtn
            title="Code"
            active={editor.isActive("code")}
            onClick={() => editor.chain().focus().toggleCode().run()}
          >
            {"<>"}
          </ToolBtn>

          <span className="mx-1 h-4 w-px bg-slate-200" />

          {/* headings */}
          <ToolBtn
            title="Heading 1"
            active={editor.isActive("heading", { level: 1 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          >
            H1
          </ToolBtn>
          <ToolBtn
            title="Heading 2"
            active={editor.isActive("heading", { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            H2
          </ToolBtn>
          <ToolBtn
            title="Heading 3"
            active={editor.isActive("heading", { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            H3
          </ToolBtn>

          <span className="mx-1 h-4 w-px bg-slate-200" />

          {/* lists */}
          <ToolBtn
            title="Bullet list"
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            ≡
          </ToolBtn>
          <ToolBtn
            title="Ordered list"
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            1.
          </ToolBtn>
          <ToolBtn
            title="Blockquote"
            active={editor.isActive("blockquote")}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            ❝
          </ToolBtn>
          <ToolBtn
            title="Code block"
            active={editor.isActive("codeBlock")}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          >
            {"{ }"}
          </ToolBtn>

          <span className="mx-1 h-4 w-px bg-slate-200" />

          {/* history */}
          <ToolBtn
            title="Undo"
            disabled={!editor.can().undo()}
            onClick={() => editor.chain().focus().undo().run()}
          >
            ↩
          </ToolBtn>
          <ToolBtn
            title="Redo"
            disabled={!editor.can().redo()}
            onClick={() => editor.chain().focus().redo().run()}
          >
            ↪
          </ToolBtn>
        </div>
      )}

      {/* editor area */}
      <div className="px-4 py-3" style={{ minHeight }}>
        <style>{PROSE_CSS}</style>
        <EditorContent editor={editor} />
      </div>

      {/* footer */}
      {!readOnly && (
        <div className="border-t border-slate-100 px-4 py-1.5 text-right text-[10px] text-slate-400">
          {words} word{words !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function parseContent(raw: string | undefined) {
  if (!raw) return "";
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

// Scoped prose styles — Tailwind Typography not installed, so inline
const PROSE_CSS = `
  .tiptap { font-size: 0.9rem; line-height: 1.75; color: #1e293b; }
  .tiptap p { margin: 0 0 0.5em; }
  .tiptap h1 { font-size: 1.35rem; font-weight: 700; margin: 0.75em 0 0.4em; }
  .tiptap h2 { font-size: 1.15rem; font-weight: 700; margin: 0.65em 0 0.35em; }
  .tiptap h3 { font-size: 1rem; font-weight: 600; margin: 0.5em 0 0.3em; }
  .tiptap ul { list-style: disc; padding-left: 1.4em; margin: 0.4em 0; }
  .tiptap ol { list-style: decimal; padding-left: 1.4em; margin: 0.4em 0; }
  .tiptap li { margin: 0.2em 0; }
  .tiptap blockquote { border-left: 3px solid #e2e8f0; margin: 0.5em 0; padding-left: 1em; color: #64748b; }
  .tiptap code { background: #f1f5f9; border-radius: 4px; padding: 0.1em 0.35em; font-size: 0.82em; font-family: monospace; color: #be185d; }
  .tiptap pre { background: #0f172a; border-radius: 12px; padding: 1em 1.2em; margin: 0.5em 0; overflow-x: auto; }
  .tiptap pre code { background: none; color: #e2e8f0; padding: 0; }
  .tiptap hr { border: none; border-top: 1px solid #e2e8f0; margin: 1em 0; }
  .tiptap strong { font-weight: 700; }
  .tiptap em { font-style: italic; }
  .tiptap s { text-decoration: line-through; color: #94a3b8; }
  .tiptap p.is-editor-empty:first-child::before { color: #94a3b8; content: attr(data-placeholder); float: left; height: 0; pointer-events: none; }
`;
