"use client";

import { useEditor, useEditorState, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";

// One shared rich text editor for every admin content form (jobs,
// opportunities, resources, courses, career paths, and anything else added
// later) instead of a plain <textarea> per page - built once so every
// description across the platform is bold/headers/bullets-capable the same
// way, rather than five different half-versions of the same idea.
//
// Deliberately a narrow extension set (StarterKit + Link), not the full
// TipTap catalogue: TipTap only ever serializes HTML for nodes/marks it
// knows about, so a small, fixed schema like this cannot emit <script> tags
// or event-handler attributes no matter what an admin pastes in - that's
// the actual XSS defense, not a plugin bolted on after the fact. The output
// is still run through DOMPurify on render (RichText.tsx) as a second,
// independent layer.
function ToolbarButton({
  onClick,
  active,
  children,
  label,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`rounded-lg px-2.5 py-1.5 text-sm font-semibold transition ${
        active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    // TipTap v3 re-renders this whole component on every transaction by
    // default (shouldRerenderOnTransaction: true) - fine for a short
    // description, but on a full-length guide/ebook every keystroke was
    // re-running isActive() for all 8 toolbar buttons and re-rendering
    // EditorContent, laggy enough that typing felt like it wasn't
    // registering. Toolbar active-state below is handled by useEditorState
    // instead, which only re-renders on the specific state it reads.
    shouldRerenderOnTransaction: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder: placeholder || "Write a description..." }),
    ],
    content: value,
    editorProps: {
      attributes: {
        // Reuses the site's existing blog-content typography (globals.css)
        // instead of a second, parallel rich-text style system - same
        // headings/lists/quotes look everywhere content is rendered.
        class: "blog-content min-h-[160px] px-4 py-3 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  const toolbarState = useEditorState({
    editor,
    selector: (ctx) =>
      ctx.editor
        ? {
            bold: ctx.editor.isActive("bold"),
            italic: ctx.editor.isActive("italic"),
            h2: ctx.editor.isActive("heading", { level: 2 }),
            h3: ctx.editor.isActive("heading", { level: 3 }),
            bulletList: ctx.editor.isActive("bulletList"),
            orderedList: ctx.editor.isActive("orderedList"),
            blockquote: ctx.editor.isActive("blockquote"),
            link: ctx.editor.isActive("link"),
          }
        : null,
  });

  if (!editor || !toolbarState) return null;

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", previousUrl || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center gap-1 border-b border-border p-2">
        <ToolbarButton label="Bold" active={toolbarState.bold} onClick={() => editor.chain().focus().toggleBold().run()}>
          <span className="font-bold">B</span>
        </ToolbarButton>
        <ToolbarButton label="Italic" active={toolbarState.italic} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <span className="italic">I</span>
        </ToolbarButton>
        <ToolbarButton label="Heading 2" active={toolbarState.h2} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          H2
        </ToolbarButton>
        <ToolbarButton label="Heading 3" active={toolbarState.h3} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          H3
        </ToolbarButton>
        <ToolbarButton label="Bullet list" active={toolbarState.bulletList} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          •&nbsp;List
        </ToolbarButton>
        <ToolbarButton label="Numbered list" active={toolbarState.orderedList} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          1.&nbsp;List
        </ToolbarButton>
        <ToolbarButton label="Quote" active={toolbarState.blockquote} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          &ldquo;&rdquo;
        </ToolbarButton>
        <ToolbarButton label="Link" active={toolbarState.link} onClick={setLink}>
          Link
        </ToolbarButton>
        <ToolbarButton label="Clear formatting" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>
          Clear
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
