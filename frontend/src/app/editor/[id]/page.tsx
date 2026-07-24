"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../lib/api";
import { Editor } from "../../../components/Editor";
import { SharingModal } from "../../../components/SharingModal";
import { CommentsSidebar } from "../../../components/CommentsSidebar";
import { VersionHistoryDrawer } from "../../../components/VersionHistoryDrawer";
import { useDebounce } from "../../../hooks/useDebounce";
import {
  FileText, Plus, Folder, Users, Star, Trash, Cloud, Check, RefreshCw,
  Share2, MessageSquare, History, RotateCcw, RotateCw, Bold, Italic,
  Underline, Strikethrough, List, ListOrdered, CheckSquare, AlignLeft,
  AlignCenter, AlignRight, AlignJustify, Minus, Maximize2, ChevronDown,
  Lock, Menu, ArrowLeft, Download, Printer, Copy, Scissors, Clipboard,
  Search, ZoomIn, ZoomOut, Type, Quote, Code, Minus as HRule, Table,
  Link as LinkIcon, HelpCircle, Keyboard, Info, X, SaveAll
} from "lucide-react";
import Link from "next/link";

interface DocumentDetail {
  id: string;
  title: string;
  content: string;
  ownerId: string;
  isOwned: boolean;
  permission: "admin" | "editor" | "edit" | "commenter" | "viewer" | "view";
  owner: { id: string; name: string | null; email: string };
  attachments: { id: string; filename: string; fileType: string; fileSize: number; uploadedAt: string }[];
}

type MenuName = "File" | "Edit" | "View" | "Insert" | "Format" | "Tools" | "Help";

// ─── Menu Dropdown definitions ─────────────────────────────────────────────
const MENU_ITEMS: Record<MenuName, { label: string; shortcut?: string; action?: string; divider?: boolean }[]> = {
  File: [
    { label: "New Document",      shortcut: "⌘N",  action: "new" },
    { label: "Open...",           shortcut: "⌘O",  action: "open" },
    { divider: true, label: "" },
    { label: "Save",              shortcut: "⌘S",  action: "save" },
    { label: "Save a Copy",                         action: "save-copy" },
    { divider: true, label: "" },
    { label: "Export as PDF",                        action: "export-pdf" },
    { label: "Export as Word (.doc)",                action: "export-word" },
    { label: "Export as Markdown",                   action: "export-md" },
    { divider: true, label: "" },
    { label: "Print",             shortcut: "⌘P",  action: "print" },
  ],
  Edit: [
    { label: "Undo",              shortcut: "⌘Z",  action: "undo" },
    { label: "Redo",              shortcut: "⌘Y",  action: "redo" },
    { divider: true, label: "" },
    { label: "Cut",               shortcut: "⌘X",  action: "cut" },
    { label: "Copy",              shortcut: "⌘C",  action: "copy" },
    { label: "Paste",             shortcut: "⌘V",  action: "paste" },
    { divider: true, label: "" },
    { label: "Select All",        shortcut: "⌘A",  action: "select-all" },
    { label: "Find & Replace",    shortcut: "⌘H",  action: "find" },
  ],
  View: [
    { label: "Zoom In",           shortcut: "⌘+",  action: "zoom-in" },
    { label: "Zoom Out",          shortcut: "⌘-",  action: "zoom-out" },
    { label: "Reset Zoom",        shortcut: "⌘0",  action: "zoom-reset" },
    { divider: true, label: "" },
    { label: "Toggle Sidebar",                      action: "sidebar" },
    { label: "Toggle Inspector",                    action: "inspector" },
    { divider: true, label: "" },
    { label: "Word Count",                          action: "wordcount" },
  ],
  Insert: [
    { label: "Table",                               action: "insert-table" },
    { label: "Horizontal Rule",                     action: "insert-rule" },
    { label: "Code Block",                          action: "insert-code" },
    { divider: true, label: "" },
    { label: "Bullet List",                         action: "bullet-list" },
    { label: "Numbered List",                       action: "ordered-list" },
    { label: "Task List",                           action: "task-list" },
    { divider: true, label: "" },
    { label: "Blockquote",                          action: "blockquote" },
    { label: "Hyperlink",         shortcut: "⌘K",  action: "link" },
  ],
  Format: [
    { label: "Bold",              shortcut: "⌘B",  action: "bold" },
    { label: "Italic",            shortcut: "⌘I",  action: "italic" },
    { label: "Underline",         shortcut: "⌘U",  action: "underline" },
    { label: "Strikethrough",                       action: "strike" },
    { divider: true, label: "" },
    { label: "Align Left",                          action: "align-left" },
    { label: "Align Center",                        action: "align-center" },
    { label: "Align Right",                         action: "align-right" },
    { label: "Justify",                             action: "align-justify" },
    { divider: true, label: "" },
    { label: "Heading 1",                           action: "h1" },
    { label: "Heading 2",                           action: "h2" },
    { label: "Heading 3",                           action: "h3" },
    { label: "Normal Text",                         action: "paragraph" },
  ],
  Tools: [
    { label: "Word Count",                          action: "wordcount" },
    { label: "Version History",                     action: "history" },
    { label: "Comments",                            action: "comments" },
    { divider: true, label: "" },
    { label: "Share Document",                      action: "share" },
  ],
  Help: [
    { label: "Keyboard Shortcuts", shortcut: "⌘/", action: "shortcuts" },
    { label: "About FastDocs",                      action: "about" },
    { divider: true, label: "" },
    { label: "Report an Issue",                     action: "report" },
  ],
};

// ─── Keyboard Shortcuts Modal ───────────────────────────────────────────────
function ShortcutsModal({ onClose }: { onClose: () => void }) {
  const shortcuts = [
    { keys: "⌘ B", desc: "Bold" },
    { keys: "⌘ I", desc: "Italic" },
    { keys: "⌘ U", desc: "Underline" },
    { keys: "⌘ Z", desc: "Undo" },
    { keys: "⌘ Y", desc: "Redo" },
    { keys: "⌘ A", desc: "Select All" },
    { keys: "⌘ S", desc: "Save" },
    { keys: "⌘ P", desc: "Print / Export PDF" },
    { keys: "⌘ K", desc: "Insert Link" },
    { keys: "⌘ +/-", desc: "Zoom In / Out" },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(5,6,20,0.85)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-md rounded-2xl p-6 space-y-4" style={{ background: '#07081b', border: '1px solid #1a1c42' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Keyboard className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-white text-base">Keyboard Shortcuts</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-1">
          {shortcuts.map(s => (
            <div key={s.desc} className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: '#090a1f' }}>
              <span className="text-sm text-slate-300">{s.desc}</span>
              <kbd className="px-2 py-0.5 rounded-md text-xs font-mono text-indigo-300" style={{ background: '#1a1c42', border: '1px solid #2a2e6e' }}>{s.keys}</kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── About Modal ────────────────────────────────────────────────────────────
function AboutModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(5,6,20,0.85)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-sm rounded-2xl p-6 text-center space-y-4" style={{ background: '#07081b', border: '1px solid #1a1c42' }}>
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-500 flex items-center justify-center mx-auto shadow-lg">
          <FileText className="w-8 h-8 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-white text-xl">FastDocs</h3>
          <p className="text-slate-400 text-sm mt-1">A modern, full-stack document editor for teams.</p>
          <p className="text-slate-600 text-xs mt-2">Version 1.0.0 · Built with Next.js + TipTap</p>
        </div>
        <button onClick={onClose} className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors">
          Close
        </button>
      </div>
    </div>
  );
}

// ─── Word Count Modal ────────────────────────────────────────────────────────
function WordCountModal({ stats, onClose }: { stats: { words: number; pages: number }; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(5,6,20,0.85)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-xs rounded-2xl p-6 space-y-4" style={{ background: '#07081b', border: '1px solid #1a1c42' }}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-base">Document Statistics</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-2">
          {[
            { label: "Words", value: stats.words },
            { label: "Pages (est.)", value: stats.pages },
            { label: "Characters (est.)", value: stats.words * 5 },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: '#090a1f' }}>
              <span className="text-sm text-slate-400">{row.label}</span>
              <span className="text-sm font-bold text-white">{row.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors">
          Done
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function DocumentEditorPage() {
  const { id } = useParams() as { id: string };
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("Untitled Document");
  const [content, setContent] = useState<any>("");
  const [isStarred, setIsStarred] = useState(false);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "unsaved">("saved");
  const [error, setError] = useState<string | null>(null);

  // Toolbar state
  const [fontFamily, setFontFamily] = useState("Inter");
  const [fontSize, setFontSize] = useState(11);
  const [textStyle, setTextStyle] = useState("Normal Text");
  const [lineSpacing, setLineSpacing] = useState("1.5");
  const [margins, setMargins] = useState({ top: 1, bottom: 1, left: 1, right: 1 });
  const [zoomLevel, setZoomLevel] = useState(100);
  const [docStats, setDocStats] = useState({ words: 0, pages: 1 });

  // Panel state
  const [inspectorTab, setInspectorTab] = useState<"Format" | "Insert" | "Review">("Format");
  const [inspectorSubTab, setInspectorSubTab] = useState<"Style" | "Layout">("Style");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [inspectorCollapsed, setInspectorCollapsed] = useState(false);

  // Dropdown/modal state
  const [openMenu, setOpenMenu] = useState<MenuName | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [wordCountOpen, setWordCountOpen] = useState(false);

  // TipTap instance
  const [editorInstance, setEditorInstance] = useState<any>(null);

  // ── Load document ──────────────────────────────────────────────────────────
  const fetchDocument = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/documents/${id}`);
      setDoc(res.data);
      setTitle(res.data.title || "Untitled Document");
      setContent(res.data.content);
      setSaveState("saved");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load document");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    } else if (user && id) {
      fetchDocument();
    }
  }, [id, user, authLoading, router, fetchDocument]);

  // ── Auto-save ──────────────────────────────────────────────────────────────
  const saveDocumentBackend = useCallback(async (newTitle: string, newContent: any) => {
    if (!doc) return;
    const canEdit = doc.isOwned || ["admin", "editor", "edit"].includes(doc.permission);
    if (!canEdit) return;
    setSaveState("saving");
    try {
      await api.put(`/api/documents/${id}`, {
        title: newTitle,
        content: typeof newContent === "object" ? JSON.stringify(newContent) : newContent
      });
      setSaveState("saved");
    } catch {
      setSaveState("unsaved");
    }
  }, [doc, id]);

  const debouncedSave = useDebounce((t: string, c: any) => saveDocumentBackend(t, c), 600);

  const canEdit = doc ? doc.isOwned || ["admin", "editor", "edit"].includes(doc.permission) : false;
  const canComment = doc ? doc.isOwned || ["admin", "editor", "edit", "commenter"].includes(doc.permission) : false;

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (canEdit) { setSaveState("unsaved"); debouncedSave(val, content); }
  };

  const handleEditorChange = (jsonContent: any) => {
    setContent(jsonContent);
    if (canEdit) { setSaveState("unsaved"); debouncedSave(title, jsonContent); }
  };

  const handleStyleChange = (styleName: string) => {
    setTextStyle(styleName);
    if (!editorInstance) return;
    if (styleName === "Heading 1") editorInstance.chain().focus().toggleHeading({ level: 1 }).run();
    else if (styleName === "Heading 2") editorInstance.chain().focus().toggleHeading({ level: 2 }).run();
    else if (styleName === "Heading 3") editorInstance.chain().focus().toggleHeading({ level: 3 }).run();
    else editorInstance.chain().focus().setParagraph().run();
  };

  const handleFontFamilyChange = (family: string) => {
    setFontFamily(family);
    editorInstance?.chain().focus().setFontFamily(family).run();
  };

  const handleFontSizeChange = (newSize: number) => {
    const clamped = Math.max(6, Math.min(96, newSize));
    setFontSize(clamped);
    editorInstance?.chain().focus().setFontSize(`${clamped}pt`).run();
  };

  const handleCreateNewDocument = async () => {
    try {
      const res = await api.post("/api/documents", { title: "Untitled Document" });
      router.push(`/editor/${res.data.id}`);
    } catch {}
  };

  const exportAsMarkdown = () => {
    const text = editorInstance?.getText() || "";
    const blob = new Blob([text], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${title}.md`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportAsWord = () => {
    const editorHTML = editorInstance?.getHTML?.() || "<p>Empty document</p>";
    const docTitle = title || "Untitled Document";
    // Word XML header makes the HTML open natively in MS Word, LibreOffice, Google Docs
    const wordHTML = `
<html xmlns:o='urn:schemas-microsoft-com:office:office'
      xmlns:w='urn:schemas-microsoft-com:office:word'
      xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>${docTitle}</title>
  <!--[if gte mso 9]>
  <xml><w:WordDocument><w:View>Print</w:View><w:Zoom>90</w:Zoom></w:WordDocument></xml>
  <![endif]-->
  <style>
    body { font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.6; color: #111; margin: 2cm 2.5cm; }
    h1 { font-size: 22pt; font-weight: bold; color: #000; border-bottom: 2pt solid #6366f1; padding-bottom: 6pt; margin-bottom: 12pt; }
    h2 { font-size: 16pt; font-weight: bold; color: #111; margin: 14pt 0 6pt; }
    h3 { font-size: 13pt; font-weight: bold; color: #222; margin: 10pt 0 4pt; }
    p  { margin: 0 0 8pt; color: #333; }
    ul, ol { margin: 0 0 8pt 20pt; }
    li { margin-bottom: 4pt; }
    blockquote { border-left: 3pt solid #6366f1; padding: 6pt 12pt; margin: 10pt 0; color: #555; }
    code { font-family: Courier New, monospace; font-size: 10pt; background: #f3f4f6; }
    pre  { font-family: Courier New, monospace; font-size: 10pt; background: #f3f4f6; padding: 10pt; }
    strong { font-weight: bold; }
    em { font-style: italic; }
  </style>
</head>
<body>${editorHTML}</body>
</html>`;

    const blob = new Blob(["\ufeff", wordHTML], {
      type: "application/vnd.ms-word;charset=utf-8"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${docTitle.replace(/[^a-z0-9\s-]/gi, "").trim() || "document"}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportAsPDF = async () => {
    const editorHTML = editorInstance?.getHTML?.() || "";
    const docTitle = title || "Untitled Document";

    // Dynamically import to avoid SSR issues
    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import("jspdf"),
      import("html2canvas"),
    ]);

    // Build a clean, styled HTML document in a hidden div
    const container = document.createElement("div");
    container.style.cssText = [
      "position:fixed", "top:0", "left:-9999px",
      "width:794px",   // A4 width in px at 96dpi
      "padding:80px 90px",
      "background:white", "color:#111",
      "font-family:Arial,sans-serif", "font-size:13px", "line-height:1.7",
      "box-sizing:border-box",
    ].join(";");

    container.innerHTML = `
      <style>
        h1{font-size:22px;font-weight:800;color:#000;margin:0 0 6px;border-bottom:2px solid #6366f1;padding-bottom:10px}
        h2{font-size:18px;font-weight:700;color:#111;margin:20px 0 6px}
        h3{font-size:15px;font-weight:600;color:#222;margin:16px 0 4px}
        p{color:#333;margin:0 0 10px}
        ul,ol{color:#333;margin:0 0 10px 22px;padding:0}
        li{margin-bottom:4px}
        blockquote{border-left:3px solid #6366f1;padding:8px 14px;margin:12px 0;background:#f5f5ff;color:#555;font-style:italic}
        code{font-family:monospace;font-size:11px;background:#f3f4f6;color:#374151;border:1px solid #d1d5db;border-radius:3px;padding:1px 5px}
        pre{font-family:monospace;font-size:11px;background:#f3f4f6;border:1px solid #d1d5db;border-radius:6px;padding:12px;margin:10px 0;white-space:pre-wrap;word-break:break-all}
        pre code{background:none;border:none;padding:0}
        a{color:#1d4ed8}
        strong{font-weight:700}
        em{font-style:italic}
        u{text-decoration:underline}
        s{text-decoration:line-through}
        ul[data-type="taskList"]{list-style:none;padding-left:0}
        ul[data-type="taskList"] li{display:flex;align-items:flex-start;gap:8px}
      </style>
      ${editorHTML || "<p><em>Empty document</em></p>"}
    `;

    document.body.appendChild(container);

    try {
      const canvas = await html2canvas(container, {
        scale: 2,           // 2× for retina / crisp text
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: 794,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageW = pdf.internal.pageSize.getWidth();   // 210 mm
      const pageH = pdf.internal.pageSize.getHeight();  // 297 mm
      const imgW  = pageW;
      const imgH  = (canvas.height * imgW) / canvas.width;

      // If the content is taller than one page, split across multiple pages
      let yOffset = 0;
      while (yOffset < imgH) {
        if (yOffset > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, -yOffset, imgW, imgH);
        yOffset += pageH;
      }

      pdf.save(`${docTitle.replace(/[^a-z0-9\s-]/gi, "").trim() || "document"}.pdf`);
    } finally {
      document.body.removeChild(container);
    }
  };

  // ── Save helpers ───────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!doc) return;
    const canEdit = doc.isOwned || ["admin", "editor", "edit"].includes(doc.permission);
    if (!canEdit) return;
    setSaveState("saving");
    try {
      await api.put(`/api/documents/${id}`, {
        title,
        content: typeof content === "object" ? JSON.stringify(content) : content
      });
      setSaveState("saved");
    } catch {
      setSaveState("unsaved");
    }
  };

  const handleSaveCopy = async () => {
    try {
      setSaveState("saving");
      const copyTitle = `Copy of ${title}`;
      const res = await api.post("/api/documents", {
        title: copyTitle,
        content: typeof content === "object" ? JSON.stringify(content) : content
      });
      setSaveState("saved");
      // Navigate to the new copy
      router.push(`/editor/${res.data.id}`);
    } catch (err) {
      console.error("Failed to save copy", err);
      setSaveState("unsaved");
    }
  };

  // ── Menu action dispatcher ─────────────────────────────────────────────────
  const handleMenuAction = (action: string) => {
    setOpenMenu(null);
    // Actions that work even without an active editor instance
    const noEditorNeeded = ["new","open","save","save-copy","history","share","comments","shortcuts","about","sidebar","inspector","wordcount","export-pdf","export-word","export-md","print","zoom-in","zoom-out","zoom-reset","report"];
    if (!editorInstance && !noEditorNeeded.includes(action)) return;
    switch (action) {
      // ── File ──
      case "new":          handleCreateNewDocument(); break;
      case "open":         router.push("/"); break;
      case "save":         handleSave(); break;
      case "save-copy":    handleSaveCopy(); break;
      case "export-pdf":   exportAsPDF(); break;
      case "export-word":  exportAsWord(); break;
      case "export-md":    exportAsMarkdown(); break;
      case "print":        window.print(); break;

      // ── Edit ──
      case "undo":         editorInstance?.chain().focus().undo().run(); break;
      case "redo":         editorInstance?.chain().focus().redo().run(); break;
      case "cut":          editorInstance?.chain().focus().run(); document.execCommand("cut"); break;
      case "copy":         editorInstance?.chain().focus().run(); document.execCommand("copy"); break;
      case "paste":        editorInstance?.chain().focus().run(); document.execCommand("paste"); break;
      case "select-all":   editorInstance?.chain().focus().selectAll().run(); break;
      case "find":         (window as any).find ? (window as any).find("") : alert("Use Ctrl+F / ⌘+F to search"); break;

      // ── Format ──
      case "bold":         editorInstance?.chain().focus().toggleBold().run(); break;
      case "italic":       editorInstance?.chain().focus().toggleItalic().run(); break;
      case "underline":    editorInstance?.chain().focus().toggleUnderline().run(); break;
      case "strike":       editorInstance?.chain().focus().toggleStrike().run(); break;
      case "align-left":   editorInstance?.chain().focus().setTextAlign("left").run(); break;
      case "align-center": editorInstance?.chain().focus().setTextAlign("center").run(); break;
      case "align-right":  editorInstance?.chain().focus().setTextAlign("right").run(); break;
      case "align-justify":editorInstance?.chain().focus().setTextAlign("justify").run(); break;
      case "h1":           editorInstance?.chain().focus().toggleHeading({ level: 1 }).run(); setTextStyle("Heading 1"); break;
      case "h2":           editorInstance?.chain().focus().toggleHeading({ level: 2 }).run(); setTextStyle("Heading 2"); break;
      case "h3":           editorInstance?.chain().focus().toggleHeading({ level: 3 }).run(); setTextStyle("Heading 3"); break;
      case "paragraph":    editorInstance?.chain().focus().setParagraph().run(); setTextStyle("Normal Text"); break;

      // ── Insert ──
      case "bullet-list":  editorInstance?.chain().focus().toggleBulletList().run(); break;
      case "ordered-list": editorInstance?.chain().focus().toggleOrderedList().run(); break;
      case "task-list":    editorInstance?.chain().focus().toggleTaskList().run(); break;
      case "blockquote":   editorInstance?.chain().focus().toggleBlockquote().run(); break;
      case "insert-code":  editorInstance?.chain().focus().toggleCodeBlock().run(); break;
      case "insert-rule":  editorInstance?.chain().focus().setHorizontalRule().run(); break;
      case "insert-table": {
        // Insert a simple 3x3 HTML table into the editor
        const tableHTML = `<table style="width:100%;border-collapse:collapse;margin:12px 0"><tbody>${
          Array(3).fill(null).map((_, r) =>
            `<tr>${Array(3).fill(null).map((__, c) =>
              `<td style="border:1px solid #334155;padding:8px 12px;min-width:80px">${r === 0 ? `<strong>Header ${c + 1}</strong>` : `Cell ${r}-${c + 1}`}</td>`
            ).join("")}</tr>`
          ).join("")
        }</tbody></table>`;
        editorInstance?.chain().focus().insertContent(tableHTML).run();
        break;
      }
      case "link": {
        const url = window.prompt("Enter URL:", "https://");
        if (url) {
          editorInstance?.chain().focus().setLink({ href: url, target: "_blank" }).run();
        }
        break;
      }

      // ── View ──
      case "zoom-in":      setZoomLevel(z => Math.min(200, z + 25)); break;
      case "zoom-out":     setZoomLevel(z => Math.max(50, z - 25)); break;
      case "zoom-reset":   setZoomLevel(100); break;
      case "sidebar":      setSidebarCollapsed(v => !v); break;
      case "inspector":    setInspectorCollapsed(v => !v); break;
      case "wordcount":    setWordCountOpen(true); break;

      // ── Modals / Panels ──
      case "history":      setHistoryOpen(true); break;
      case "comments":     setCommentsOpen(true); break;
      case "share":        setShareModalOpen(true); break;
      case "shortcuts":    setShortcutsOpen(true); break;
      case "about":        setAboutOpen(true); break;
      case "report":       window.open("https://github.com/", "_blank"); break;
    }
  };

  // ── Loading / Error states ─────────────────────────────────────────────────
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050614' }}>
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-500 flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-center space-x-2 text-slate-400 text-sm">
            <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            <span>Opening document...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: '#050614' }}>
        <div className="p-8 rounded-3xl max-w-md w-full text-center space-y-4" style={{ background: '#0a0b22', border: '1px solid #1a1c40' }}>
          <h2 className="text-xl font-bold text-white">Access Error</h2>
          <p className="text-xs text-slate-400">{error || "Document not found."}</p>
          <Link href="/" className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold">
            <ArrowLeft className="w-4 h-4" /><span>Back to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  const userInitials = user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <div className="h-screen flex overflow-hidden text-slate-100 font-sans" style={{ background: '#050614' }}
      onClick={() => openMenu && setOpenMenu(null)}>

      {/* ── LEFT SIDEBAR ─────────────────────────────────────────────────── */}
      {!sidebarCollapsed && (
        <aside className="w-56 shrink-0 flex flex-col justify-between p-4" style={{ background: '#07081b', borderRight: '1px solid #151733' }}>
          <div className="space-y-5">
            {/* Logo */}
            <div className="flex items-center justify-between px-1">
              <Link href="/" className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-500 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold text-white">FastDocs</span>
              </Link>
              <button onClick={() => setSidebarCollapsed(true)} className="p-1 text-slate-500 hover:text-slate-300 rounded-lg">
                <Menu className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* New Doc */}
            <button onClick={handleCreateNewDocument}
              className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-semibold text-xs shadow-lg">
              <Plus className="w-3.5 h-3.5" /><span>New Document</span>
            </button>

            {/* Nav */}
            <nav className="space-y-0.5">
              {([
                { href: "/", icon: Folder, label: "My Library",   active: true  },
                { href: "/", icon: Users,  label: "Shared with me", active: false },
                { href: "/", icon: Star,   label: "Starred",      active: false },
                { href: "/", icon: Trash,  label: "Trash",        active: false },
              ] as const).map(({ href, icon: Icon, label, active }) => (
                <Link key={label} href={href}
                  className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors"
                  style={active ? { background: '#14163c', color: '#a5b4fc', border: '1px solid #22255c' } : { color: '#94a3b8' }}
                  onMouseEnter={e => !active && (e.currentTarget.style.background = '#0c0d29')}
                  onMouseLeave={e => !active && (e.currentTarget.style.background = 'transparent')}
                >
                  <Icon className="w-3.5 h-3.5" /><span>{label}</span>
                </Link>
              ))}
            </nav>

            {/* Workspaces */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <span>Workspaces</span><span className="font-normal cursor-pointer hover:text-slate-300">+</span>
              </div>
              {[
                { label: "Product Team", color: "#a855f7", bg: "rgba(126,34,206,0.2)", letter: "P" },
                { label: "Design Team",  color: "#2dd4bf", bg: "rgba(13,148,136,0.2)", letter: "D" },
                { label: "Engineering",  color: "#34d399", bg: "rgba(5,150,105,0.2)",  letter: "E" },
                { label: "Marketing",    color: "#fbbf24", bg: "rgba(180,83,9,0.2)",   letter: "M" },
              ].map(ws => (
                <div key={ws.label}
                  className="flex items-center space-x-2.5 px-3 py-2 rounded-xl cursor-pointer text-xs text-slate-300 hover:text-white transition-colors"
                  onMouseEnter={e => (e.currentTarget.style.background = '#0c0d29')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0"
                    style={{ background: ws.bg, color: ws.color }}>{ws.letter}</span>
                  <span>{ws.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Storage */}
          <div className="space-y-1.5 pt-4" style={{ borderTop: '1px solid #151733' }}>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center space-x-1"><Cloud className="w-3 h-3" /><span>Storage</span></div>
              <span className="font-medium text-slate-300">2.4 / 10 GB</span>
            </div>
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: '#121336' }}>
              <div className="h-full w-[24%] rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" />
            </div>
          </div>
        </aside>
      )}

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── TOP HEADER ─────────────────────────────────────────────────── */}
        <header style={{ background: '#07081b', borderBottom: '1px solid #151733' }}>
          {/* Title row */}
          <div className="flex items-center justify-between px-5 py-2.5">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {sidebarCollapsed && (
                <button onClick={() => setSidebarCollapsed(false)} className="p-1 text-slate-400 hover:text-white">
                  <Menu className="w-4 h-4" />
                </button>
              )}
              <input
                type="text" value={title} onChange={handleTitleChange} readOnly={!canEdit}
                className="text-sm font-bold text-white bg-transparent border border-transparent rounded-lg px-2 py-0.5 focus:outline-none focus:border-indigo-500 transition-colors"
                style={{ minWidth: 120, maxWidth: 300 }}
                onMouseEnter={e => canEdit && (e.currentTarget.style.borderColor = '#1e2048')}
                onMouseLeave={e => !e.currentTarget.matches(':focus') && (e.currentTarget.style.borderColor = 'transparent')}
              />
              <button onClick={() => setIsStarred(!isStarred)} className="p-1 text-slate-500 hover:text-amber-400 transition-colors">
                <Star className={`w-3.5 h-3.5 ${isStarred ? "fill-amber-400 text-amber-400" : ""}`} />
              </button>
              <div className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                style={{
                  background: '#0c0e28', border: '1px solid',
                  borderColor: saveState === 'saved' ? 'rgba(52,211,153,0.3)' : saveState === 'saving' ? 'rgba(99,102,241,0.3)' : 'rgba(251,146,60,0.3)',
                  color: saveState === 'saved' ? '#34d399' : saveState === 'saving' ? '#a5b4fc' : '#fb923c'
                }}>
                {saveState === 'saved' && <><Check className="w-2.5 h-2.5 mr-1" />Saved</>}
                {saveState === 'saving' && <><RefreshCw className="w-2.5 h-2.5 mr-1 animate-spin" />Saving...</>}
                {saveState === 'unsaved' && <>Unsaved changes</>}
              </div>
            </div>

            {/* Right controls */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs text-slate-300"
                style={{ background: '#0c0e28', border: '1px solid #1b1d44' }}>
                <Users className="w-3 h-3 text-emerald-400" />
                <div className="w-5 h-5 rounded-full bg-indigo-600 text-[10px] font-bold flex items-center justify-center text-white">{userInitials}</div>
                <span className="text-[11px]">1 online</span>
                <ChevronDown className="w-2.5 h-2.5 text-slate-500" />
              </div>

              <button onClick={() => setCommentsOpen(true)} title="Comments"
                className="p-2 rounded-xl text-slate-400 hover:text-white transition-colors"
                style={{ background: '#0c0e28', border: '1px solid #1b1d44' }}>
                <MessageSquare className="w-3.5 h-3.5" />
              </button>

              <button onClick={() => setHistoryOpen(true)} title="Version History"
                className="p-2 rounded-xl text-slate-400 hover:text-white transition-colors"
                style={{ background: '#0c0e28', border: '1px solid #1b1d44' }}>
                <History className="w-3.5 h-3.5" />
              </button>

              <button onClick={() => setShareModalOpen(true)}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold text-xs shadow-md transition-all">
                <Share2 className="w-3 h-3" /><span>Share</span>
              </button>
            </div>
          </div>

          {/* ── MENU BAR ──────────────────────────────────────────────────── */}
          <div className="flex items-center space-x-1 px-5 pb-2 text-xs relative" style={{ borderTop: '1px solid #0f1028' }}>
            {(Object.keys(MENU_ITEMS) as MenuName[]).map((menu) => (
              <div key={menu} className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === menu ? null : menu); }}
                  className="relative px-2.5 py-1 rounded-lg font-medium transition-colors"
                  style={{
                    color: openMenu === menu ? '#a5b4fc' : '#94a3b8',
                    background: openMenu === menu ? '#14163c' : 'transparent'
                  }}
                  onMouseEnter={e => openMenu !== menu && (e.currentTarget.style.color = '#e2e8f0')}
                  onMouseLeave={e => openMenu !== menu && (e.currentTarget.style.color = '#94a3b8')}
                >
                  {menu}
                  {openMenu === menu && (
                    <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-indigo-500 rounded-full" />
                  )}
                </button>

                {/* Dropdown */}
                {openMenu === menu && (
                  <div
                    className="absolute top-full left-0 mt-1 w-52 rounded-xl shadow-2xl z-50 py-1 overflow-hidden"
                    style={{ background: '#0d0e2a', border: '1px solid #1e2050' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {MENU_ITEMS[menu].map((item, idx) =>
                      item.divider ? (
                        <div key={idx} className="my-1 mx-3" style={{ borderTop: '1px solid #1a1c42' }} />
                      ) : (
                        <button
                          key={item.label}
                          onClick={() => handleMenuAction(item.action || "")}
                          className="w-full flex items-center justify-between px-4 py-2 text-xs text-slate-300 hover:text-white transition-colors"
                          onMouseEnter={e => (e.currentTarget.style.background = '#14163c')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <span>{item.label}</span>
                          {item.shortcut && (
                            <kbd className="text-[10px] text-slate-500 font-mono">{item.shortcut}</kbd>
                          )}
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </header>

        {/* ── HORIZONTAL TOOLBAR ─────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2 px-5 py-2" style={{ background: '#090a20', borderBottom: '1px solid #151733' }}>
          {/* Undo/Redo */}
          <div className="flex items-center space-x-1 pr-2" style={{ borderRight: '1px solid #1a1c42' }}>
            <button onClick={() => editorInstance?.chain().focus().undo().run()} title="Undo"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#14163c] transition-colors">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => editorInstance?.chain().focus().redo().run()} title="Redo"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#14163c] transition-colors">
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Style */}
          <select value={textStyle} onChange={(e) => handleStyleChange(e.target.value)}
            className="text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none"
            style={{ background: '#050614', border: '1px solid #1a1c42' }}>
            <option>Normal Text</option>
            <option>Heading 1</option>
            <option>Heading 2</option>
            <option>Heading 3</option>
          </select>

          {/* Font Family */}
          <select value={fontFamily} onChange={(e) => handleFontFamilyChange(e.target.value)}
            className="text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none"
            style={{ background: '#050614', border: '1px solid #1a1c42' }}>
            {["Inter","Roboto","Arial","Georgia","Courier New","Times New Roman"].map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>

          {/* Font Size */}
          <div className="flex items-center space-x-0.5 rounded-lg px-1.5" style={{ background: '#050614', border: '1px solid #1a1c42' }}>
            <button onClick={() => handleFontSizeChange(fontSize - 1)} className="p-1 text-slate-400 hover:text-white"><Minus className="w-3 h-3" /></button>
            <input type="number" value={fontSize} min={6} max={96}
              onChange={(e) => handleFontSizeChange(Number(e.target.value))}
              className="w-8 bg-transparent text-center text-xs text-white font-medium focus:outline-none" />
            <button onClick={() => handleFontSizeChange(fontSize + 1)} className="p-1 text-slate-400 hover:text-white"><Plus className="w-3 h-3" /></button>
          </div>

          <div className="h-4 w-px" style={{ background: '#1a1c42' }} />

          {/* Bold/Italic/Underline/Strike */}
          {([
            { icon: Bold,          cmd: "bold",      title: "Bold (⌘B)" },
            { icon: Italic,        cmd: "italic",    title: "Italic (⌘I)" },
            { icon: Underline,     cmd: "underline", title: "Underline (⌘U)" },
            { icon: Strikethrough, cmd: "strike",    title: "Strikethrough" },
          ] as const).map(({ icon: Icon, cmd, title }) => (
            <button key={cmd} title={title}
              onClick={() => editorInstance?.chain().focus()[`toggle${cmd.charAt(0).toUpperCase() + cmd.slice(1)}`]().run()}
              className="p-1.5 rounded-lg transition-colors"
              style={{
                background: editorInstance?.isActive(cmd) ? '#4f46e5' : 'transparent',
                color: editorInstance?.isActive(cmd) ? 'white' : '#94a3b8'
              }}
              onMouseEnter={e => !editorInstance?.isActive(cmd) && (e.currentTarget.style.background = '#14163c')}
              onMouseLeave={e => !editorInstance?.isActive(cmd) && (e.currentTarget.style.background = 'transparent')}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}

          <div className="h-4 w-px" style={{ background: '#1a1c42' }} />

          {/* Alignment */}
          {([
            { icon: AlignLeft,    align: "left",    title: "Align Left" },
            { icon: AlignCenter,  align: "center",  title: "Align Center" },
            { icon: AlignRight,   align: "right",   title: "Align Right" },
            { icon: AlignJustify, align: "justify", title: "Justify" },
          ] as const).map(({ icon: Icon, align, title }) => (
            <button key={align} title={title}
              onClick={() => editorInstance?.chain().focus().setTextAlign(align).run()}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#14163c] transition-colors">
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}

          <div className="h-4 w-px" style={{ background: '#1a1c42' }} />

          {/* Lists */}
          <button title="Bullet List" onClick={() => editorInstance?.chain().focus().toggleBulletList().run()}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#14163c] transition-colors">
            <List className="w-3.5 h-3.5" />
          </button>
          <button title="Numbered List" onClick={() => editorInstance?.chain().focus().toggleOrderedList().run()}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#14163c] transition-colors">
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button title="Task List" onClick={() => editorInstance?.chain().focus().toggleTaskList().run()}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#14163c] transition-colors">
            <CheckSquare className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px" style={{ background: '#1a1c42' }} />

          {/* Code Block */}
          <button title="Code Block" onClick={() => editorInstance?.chain().focus().toggleCodeBlock().run()}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#14163c] transition-colors">
            <Code className="w-3.5 h-3.5" />
          </button>
          {/* Blockquote */}
          <button title="Blockquote" onClick={() => editorInstance?.chain().focus().toggleBlockquote().run()}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#14163c] transition-colors">
            <Quote className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ── EDITOR CANVAS ──────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto" style={{ background: '#050614' }}>
          <Editor
            content={content}
            onChange={handleEditorChange}
            readOnly={!canEdit}
            onUpdateStats={setDocStats}
            fontFamily={fontFamily}
            fontSize={fontSize}
            lineSpacing={lineSpacing}
            margins={margins}
            zoomLevel={zoomLevel}
            externalEditorRef={setEditorInstance}
          />
        </div>

        {/* ── STATUS BAR ─────────────────────────────────────────────────── */}
        <footer className="flex items-center justify-between px-5 py-2 text-xs text-slate-400 shrink-0"
          style={{ background: '#07081b', borderTop: '1px solid #151733' }}>
          <div className="flex items-center space-x-4">
            <span>Page {docStats.pages} of {docStats.pages}</span>
            <span style={{ color: '#1e2050' }}>|</span>
            <button onClick={() => setWordCountOpen(true)} className="hover:text-slate-200 transition-colors">
              {docStats.words} words
            </button>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={() => setZoomLevel(z => Math.max(50, z - 25))} className="p-1 hover:text-white transition-colors">
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <select value={zoomLevel} onChange={(e) => setZoomLevel(Number(e.target.value))}
              className="text-slate-300 text-[11px] rounded-lg px-2 py-0.5 focus:outline-none"
              style={{ background: '#050614', border: '1px solid #1a1c42' }}>
              {[50, 75, 100, 125, 150, 200].map(z => <option key={z} value={z}>{z}%</option>)}
            </select>
            <button onClick={() => setZoomLevel(z => Math.min(200, z + 25))} className="p-1 hover:text-white transition-colors">
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setZoomLevel(100)} title="Reset zoom" className="p-1 hover:text-white transition-colors">
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </footer>
      </div>

      {/* ── RIGHT INSPECTOR ──────────────────────────────────────────────── */}
      {!inspectorCollapsed && (
        <aside className="w-72 shrink-0 flex flex-col p-4 overflow-y-auto" style={{ background: '#07081b', borderLeft: '1px solid #151733' }}>
          {/* Inspector Top Tabs */}
          <div className="flex items-center justify-between pb-3 mb-4" style={{ borderBottom: '1px solid #151733' }}>
            <div className="flex items-center space-x-4 text-xs font-semibold">
              {(["Format", "Insert", "Review"] as const).map(tab => (
                <button key={tab} onClick={() => setInspectorTab(tab)}
                  className="relative pb-2 transition-colors"
                  style={{ color: inspectorTab === tab ? '#a5b4fc' : '#64748b' }}>
                  {tab}
                  {inspectorTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-indigo-500" />}
                </button>
              ))}
            </div>
            <button onClick={() => setInspectorCollapsed(true)} className="p-1 text-slate-600 hover:text-slate-300 rounded-lg">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {inspectorTab === "Format" && (
            <div className="space-y-5">
              {/* Style / Layout Sub-tabs */}
              <div className="flex items-center space-x-3 text-xs">
                {(["Style", "Layout"] as const).map(t => (
                  <button key={t} onClick={() => setInspectorSubTab(t)}
                    className="pb-1.5 font-semibold transition-colors"
                    style={{
                      color: inspectorSubTab === t ? '#818cf8' : '#64748b',
                      borderBottom: inspectorSubTab === t ? '2px solid #6366f1' : '2px solid transparent'
                    }}>
                    {t}
                  </button>
                ))}
              </div>

              {inspectorSubTab === "Style" ? (
                <div className="space-y-4">
                  {/* Text Style */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Text</label>
                    <select value={textStyle} onChange={(e) => handleStyleChange(e.target.value)}
                      className="w-full text-slate-200 text-xs rounded-xl p-2.5 focus:outline-none"
                      style={{ background: '#090a20', border: '1px solid #1a1c42' }}>
                      <option>Normal Text</option>
                      <option>Heading 1</option>
                      <option>Heading 2</option>
                      <option>Heading 3</option>
                    </select>
                  </div>

                  {/* Font */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Font</label>
                    <select value={fontFamily} onChange={(e) => handleFontFamilyChange(e.target.value)}
                      className="w-full text-slate-200 text-xs rounded-xl p-2.5 focus:outline-none"
                      style={{ background: '#090a20', border: '1px solid #1a1c42' }}>
                      {["Inter","Roboto","Arial","Georgia","Courier New","Times New Roman"].map(f => <option key={f}>{f}</option>)}
                    </select>

                    <div className="flex items-center space-x-2">
                      <div className="flex items-center justify-between flex-1 rounded-xl px-3 py-2"
                        style={{ background: '#090a20', border: '1px solid #1a1c42' }}>
                        <button onClick={() => handleFontSizeChange(fontSize - 1)} className="text-slate-400 hover:text-white"><Minus className="w-3.5 h-3.5" /></button>
                        <input type="number" value={fontSize} min={6} max={96}
                          onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                          className="w-8 bg-transparent text-center text-white font-bold text-xs focus:outline-none" />
                        <button onClick={() => handleFontSizeChange(fontSize + 1)} className="text-slate-400 hover:text-white"><Plus className="w-3.5 h-3.5" /></button>
                      </div>

                      {/* B/I/U/S toggles */}
                      <div className="flex items-center space-x-0.5 p-1 rounded-xl" style={{ background: '#090a20', border: '1px solid #1a1c42' }}>
                        {([
                          { icon: Bold, cmd: "bold" }, { icon: Italic, cmd: "italic" },
                          { icon: Underline, cmd: "underline" }, { icon: Strikethrough, cmd: "strike" }
                        ] as const).map(({ icon: Icon, cmd }) => (
                          <button key={cmd}
                            onClick={() => editorInstance?.chain().focus()[`toggle${cmd.charAt(0).toUpperCase() + cmd.slice(1)}`]().run()}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{
                              background: editorInstance?.isActive(cmd) ? '#4f46e5' : 'transparent',
                              color: editorInstance?.isActive(cmd) ? 'white' : '#64748b'
                            }}>
                            <Icon className="w-3 h-3" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Paragraph alignment */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Paragraph</label>
                    <div className="grid grid-cols-4 gap-1 p-1 rounded-xl" style={{ background: '#090a20', border: '1px solid #1a1c42' }}>
                      {([
                        { icon: AlignLeft, align: "left" }, { icon: AlignCenter, align: "center" },
                        { icon: AlignRight, align: "right" }, { icon: AlignJustify, align: "justify" }
                      ] as const).map(({ icon: Icon, align }) => (
                        <button key={align}
                          onClick={() => editorInstance?.chain().focus().setTextAlign(align).run()}
                          className="p-2 rounded-lg flex items-center justify-center transition-colors"
                          style={{
                            background: editorInstance?.isActive({ textAlign: align }) ? '#4f46e5' : 'transparent',
                            color: editorInstance?.isActive({ textAlign: align }) ? 'white' : '#64748b'
                          }}>
                          <Icon className="w-4 h-4" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Line Spacing */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Line Spacing</label>
                    <select value={lineSpacing} onChange={(e) => setLineSpacing(e.target.value)}
                      className="w-full text-slate-200 text-xs rounded-xl p-2.5 focus:outline-none"
                      style={{ background: '#090a20', border: '1px solid #1a1c42' }}>
                      <option value="1.0">1.0 Single</option>
                      <option value="1.15">1.15</option>
                      <option value="1.5">1.5</option>
                      <option value="2.0">2.0 Double</option>
                    </select>
                  </div>
                </div>
              ) : (
                /* LAYOUT TAB */
                <div className="space-y-4">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Margins (inches)</label>
                  <div className="flex flex-col items-center space-y-2 p-4 rounded-2xl"
                    style={{ background: '#090a20', border: '1px solid #1a1c42' }}>
                    <input type="number" step="0.1" value={margins.top}
                      onChange={(e) => setMargins({ ...margins, top: Number(e.target.value) })}
                      className="w-14 text-center text-white text-xs rounded-lg py-1.5 focus:outline-none"
                      style={{ background: '#050614', border: '1px solid #1e204d' }} />
                    <div className="flex items-center justify-between w-full">
                      <input type="number" step="0.1" value={margins.left}
                        onChange={(e) => setMargins({ ...margins, left: Number(e.target.value) })}
                        className="w-14 text-center text-white text-xs rounded-lg py-1.5 focus:outline-none"
                        style={{ background: '#050614', border: '1px solid #1e204d' }} />
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-indigo-400"
                        style={{ border: '2px solid rgba(79,70,229,0.4)', background: 'rgba(99,102,241,0.1)' }}>
                        <Lock className="w-4 h-4" />
                      </div>
                      <input type="number" step="0.1" value={margins.right}
                        onChange={(e) => setMargins({ ...margins, right: Number(e.target.value) })}
                        className="w-14 text-center text-white text-xs rounded-lg py-1.5 focus:outline-none"
                        style={{ background: '#050614', border: '1px solid #1e204d' }} />
                    </div>
                    <input type="number" step="0.1" value={margins.bottom}
                      onChange={(e) => setMargins({ ...margins, bottom: Number(e.target.value) })}
                      className="w-14 text-center text-white text-xs rounded-lg py-1.5 focus:outline-none"
                      style={{ background: '#050614', border: '1px solid #1e204d' }} />
                  </div>
                  <button className="w-full py-2.5 rounded-xl text-slate-200 text-xs font-semibold transition-colors hover:text-white"
                    style={{ background: '#090a20', border: '1px solid #1a1c42' }}>
                    Page setup
                  </button>
                </div>
              )}
            </div>
          )}

          {inspectorTab === "Insert" && (
            <div className="space-y-2">
              <p className="text-[11px] text-slate-500 uppercase tracking-wider font-bold mb-3">Insert element</p>
              {[
                { label: "Bullet List",    action: () => editorInstance?.chain().focus().toggleBulletList().run() },
                { label: "Numbered List",  action: () => editorInstance?.chain().focus().toggleOrderedList().run() },
                { label: "Task List",      action: () => editorInstance?.chain().focus().toggleTaskList().run() },
                { label: "Code Block",     action: () => editorInstance?.chain().focus().toggleCodeBlock().run() },
                { label: "Blockquote",     action: () => editorInstance?.chain().focus().toggleBlockquote().run() },
                { label: "Horizontal Rule",action: () => editorInstance?.chain().focus().setHorizontalRule().run() },
              ].map(item => (
                <button key={item.label} onClick={item.action}
                  className="w-full text-left px-4 py-2.5 rounded-xl text-xs text-slate-300 hover:text-white transition-colors"
                  style={{ background: '#090a20', border: '1px solid #1a1c42' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#14163c')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#090a20')}>
                  {item.label}
                </button>
              ))}
            </div>
          )}

          {inspectorTab === "Review" && (
            <div className="space-y-3">
              <button onClick={() => setCommentsOpen(true)}
                className="w-full flex items-center space-x-2.5 px-4 py-3 rounded-xl text-sm text-slate-300 hover:text-white transition-colors"
                style={{ background: '#090a20', border: '1px solid #1a1c42' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#14163c')}
                onMouseLeave={e => (e.currentTarget.style.background = '#090a20')}>
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <span>Open Comments</span>
              </button>
              <button onClick={() => setHistoryOpen(true)}
                className="w-full flex items-center space-x-2.5 px-4 py-3 rounded-xl text-sm text-slate-300 hover:text-white transition-colors"
                style={{ background: '#090a20', border: '1px solid #1a1c42' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#14163c')}
                onMouseLeave={e => (e.currentTarget.style.background = '#090a20')}>
                <History className="w-4 h-4 text-indigo-400" />
                <span>Version History</span>
              </button>
              {canEdit && (
                <button onClick={() => saveDocumentBackend(title, content)}
                  className="w-full flex items-center space-x-2.5 px-4 py-3 rounded-xl text-sm text-slate-300 hover:text-white transition-colors"
                  style={{ background: '#090a20', border: '1px solid #1a1c42' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#14163c')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#090a20')}>
                  <SaveAll className="w-4 h-4 text-emerald-400" />
                  <span>Save Now</span>
                </button>
              )}
            </div>
          )}
        </aside>
      )}

      {/* Collapsed inspector toggle */}
      {inspectorCollapsed && (
        <button onClick={() => setInspectorCollapsed(false)} title="Show inspector"
          className="fixed right-0 top-1/2 -translate-y-1/2 p-2 rounded-l-xl text-slate-400 hover:text-white z-40 transition-colors"
          style={{ background: '#0d0e2a', border: '1px solid #1a1c42', borderRight: 'none' }}>
          <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
        </button>
      )}

      {/* ── MODALS & DRAWERS ───────────────────────────────────────────── */}
      {(doc.isOwned || doc.permission === "admin") && (
        <SharingModal documentId={doc.id} isOpen={shareModalOpen} onClose={() => setShareModalOpen(false)} />
      )}
      <CommentsSidebar documentId={doc.id} isOpen={commentsOpen} onClose={() => setCommentsOpen(false)} canComment={canComment} />
      <VersionHistoryDrawer documentId={doc.id} isOpen={historyOpen} onClose={() => setHistoryOpen(false)}
        onRestoreVersion={(d) => { setTitle(d.title); setContent(d.content); }} canEdit={canEdit} />
      {shortcutsOpen && <ShortcutsModal onClose={() => setShortcutsOpen(false)} />}
      {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}
      {wordCountOpen && <WordCountModal stats={docStats} onClose={() => setWordCountOpen(false)} />}
    </div>
  );
}
