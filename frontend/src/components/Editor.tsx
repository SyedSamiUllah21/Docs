"use client";

import { useEditor, EditorContent, Extension } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import FontFamily from "@tiptap/extension-font-family";
import TextStyle from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import { useEffect } from "react";

// Custom FontSize mark extension (TipTap v2 compatible)
const FontSize = Extension.create({
  name: "fontSize",
  addGlobalAttributes() {
    return [
      {
        types: ["textStyle"],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (el) => el.style.fontSize || null,
            renderHTML: (attrs) => {
              if (!attrs.fontSize) return {};
              return { style: `font-size: ${attrs.fontSize}` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain }: any) => {
          return chain().setMark("textStyle", { fontSize }).run();
        },
      unsetFontSize:
        () =>
        ({ chain }: any) => {
          return chain()
            .setMark("textStyle", { fontSize: null })
            .removeEmptyTextStyle()
            .run();
        },
    } as any;
  },
});

interface EditorProps {
  content: string;
  onChange: (content: any) => void;
  readOnly?: boolean;
  onUpdateStats?: (stats: { words: number; pages: number }) => void;
  fontFamily?: string;
  fontSize?: number;
  lineSpacing?: string;
  margins?: { top: number; bottom: number; left: number; right: number };
  zoomLevel?: number;
  externalEditorRef?: (editor: any) => void;
}

export function Editor({
  content,
  onChange,
  readOnly = false,
  onUpdateStats,
  fontFamily = "Inter",
  fontSize = 11,
  lineSpacing = "1.5",
  margins = { top: 1, bottom: 1, left: 1, right: 1 },
  zoomLevel = 100,
  externalEditorRef,
}: EditorProps) {
  const parseInitialContent = (rawContent: string) => {
    try {
      if (!rawContent) return "<p></p>";
      return JSON.parse(rawContent);
    } catch {
      return rawContent;
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      Underline,
      TextStyle,
      FontFamily.configure({ types: ["textStyle"] }),
      FontSize,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({
        openOnClick: true,
        HTMLAttributes: { class: "text-indigo-400 underline" },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: parseInitialContent(content),
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
      const text = editor.getText().trim();
      const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
      if (onUpdateStats) {
        onUpdateStats({ words, pages: Math.max(1, Math.ceil(words / 400)) });
      }
    },
  });

  // Expose editor instance to parent
  useEffect(() => {
    if (editor && externalEditorRef) {
      externalEditorRef(editor);
    }
  }, [editor, externalEditorRef]);

  // Sync content from parent (only when not focused to avoid cursor jump)
  useEffect(() => {
    if (!editor || editor.isFocused) return;
    const currentJSON = JSON.stringify(editor.getJSON());
    let incomingJSON = "";
    try {
      incomingJSON =
        typeof content === "string" ? content : JSON.stringify(content);
    } catch {
      incomingJSON = "";
    }
    if (currentJSON !== incomingJSON) {
      try {
        editor.commands.setContent(JSON.parse(incomingJSON), false);
      } catch {
        editor.commands.setContent(content, false);
      }
    }
  }, [content, editor]);

  // Apply font family to entire document via CSS on the container
  // AND push it into TipTap as a mark on all selected text
  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!readOnly);
  }, [readOnly, editor]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 font-medium">
        Loading editor...
      </div>
    );
  }

  // Convert font name to proper CSS font stack
  const fontCSSMap: Record<string, string> = {
    Inter: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    Roboto: "'Roboto', Arial, sans-serif",
    Arial: "Arial, Helvetica, sans-serif",
    Georgia: "Georgia, 'Times New Roman', serif",
    "Courier New": "'Courier New', Courier, monospace",
    "Times New Roman": "'Times New Roman', Times, serif",
  };

  const resolvedFontFamily = fontCSSMap[fontFamily] ?? fontFamily;
  // TipTap base font size for the .ProseMirror wrapper
  const resolvedFontSize = `${fontSize}pt`;

  return (
    <div className="w-full flex flex-col items-center justify-start py-6 min-h-[650px] overflow-x-auto">
      {/* Inch Ruler — hidden on print */}
      <div
        data-print-hide="true"
        className="mb-1 flex items-end text-[9px] text-slate-600 font-mono select-none print-hide"
        style={{ width: "min(800px, 100%)", paddingLeft: "2.5rem", paddingRight: "2.5rem" }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
          <div key={n} className="flex-1 flex flex-col items-end border-r border-slate-700/40 pr-0.5">
            {n > 0 && <span>{n}</span>}
            <div className="h-1.5 w-px bg-slate-700/60 mt-0.5" />
          </div>
        ))}
      </div>

      {/* Paper Sheet — print-doc-sheet makes it the only thing visible when printing */}
      <div
        className="print-doc-sheet"
        style={{
          transform: `scale(${zoomLevel / 100})`,
          transformOrigin: "top center",
          paddingTop: `${margins.top * 96}px`,
          paddingBottom: `${margins.bottom * 96}px`,
          paddingLeft: `${margins.left * 96}px`,
          paddingRight: `${margins.right * 96}px`,
          fontFamily: resolvedFontFamily,
          fontSize: resolvedFontSize,
          lineHeight: lineSpacing,
          width: "min(800px, 100%)",
          background: "#090a1f",
          border: "1px solid #1a1c42",
          borderRadius: "1rem",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.9)",
          minHeight: "1050px",
        }}
      >
        <style>{`
          .ProseMirror {
            min-height: 860px;
            outline: none;
            font-family: ${resolvedFontFamily};
            font-size: ${resolvedFontSize};
            line-height: ${lineSpacing};
            color: #e2e8f0;
          }
          .ProseMirror p { margin: 0 0 0.5em 0; }
          .ProseMirror h1 { font-size: 2em; font-weight: 700; margin: 0.5em 0; }
          .ProseMirror h2 { font-size: 1.5em; font-weight: 700; margin: 0.5em 0; }
          .ProseMirror h3 { font-size: 1.25em; font-weight: 700; margin: 0.5em 0; }
          .ProseMirror ul { list-style: disc; padding-left: 1.5em; margin: 0.5em 0; }
          .ProseMirror ol { list-style: decimal; padding-left: 1.5em; margin: 0.5em 0; }
          .ProseMirror li p { margin: 0; }
          .ProseMirror a { color: #818cf8; text-decoration: underline; }
          .ProseMirror ul[data-type="taskList"] { list-style: none; padding-left: 0; }
          .ProseMirror ul[data-type="taskList"] li { display: flex; align-items: flex-start; gap: 0.5em; }
          .ProseMirror ul[data-type="taskList"] li input[type="checkbox"] { margin-top: 0.25em; accent-color: #6366f1; }
          .ProseMirror blockquote { border-left: 3px solid #4f46e5; margin: 0.5em 0; padding-left: 1em; color: #94a3b8; }
          .ProseMirror code { background: #1e1e3a; border-radius: 4px; padding: 0.1em 0.4em; font-family: 'Courier New', monospace; font-size: 0.85em; color: #a5b4fc; }
          .ProseMirror pre { background: #1e1e3a; border-radius: 8px; padding: 1em; overflow-x: auto; }
          .ProseMirror pre code { background: none; padding: 0; font-size: 0.9em; }
          .ProseMirror p.is-editor-empty:first-child::before { content: attr(data-placeholder); color: #475569; pointer-events: none; float: left; height: 0; }
        `}</style>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
