"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { api } from "../lib/api";
import {
  FileText,
  Plus,
  Upload,
  Search,
  Trash2,
  UserCheck,
  Eye,
  Edit3,
  Paperclip,
  Calendar,
  Star,
  MoreVertical,
  Bell,
  Cloud,
  LayoutGrid,
  List,
  Sparkles,
  Users,
  Folder,
  Trash,
  ChevronDown,
  LogOut,
  Command
} from "lucide-react";
import Link from "next/link";

interface DocumentItem {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
  isOwned: boolean;
  permission: "admin" | "editor" | "edit" | "commenter" | "viewer" | "view";
  owner: {
    id: string;
    name: string | null;
    email: string;
  };
  attachments?: { id: string; filename: string }[];
}

export default function DashboardPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "owned" | "shared" | "starred">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [starredIds, setStarredIds] = useState<string[]>([]);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [activeNav, setActiveNav] = useState<"library" | "shared" | "starred" | "trash">("library");

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/documents");
      setDocuments(res.data);
    } catch (err) {
      console.error("Failed to load documents", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    } else if (user) {
      fetchDocuments();
    }
  }, [user, authLoading, router]);

  const handleCreateDocument = async () => {
    try {
      const res = await api.post("/api/documents", {
        title: "Untitled Document"
      });
      router.push(`/editor/${res.data.id}`);
    } catch (err) {
      console.error("Failed to create document", err);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const content = JSON.stringify({
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 1 },
            content: [{ type: "text", text: file.name.replace(/\.[^/.]+$/, "") }]
          },
          {
            type: "paragraph",
            content: [{ type: "text", text: text }]
          }
        ]
      });

      const res = await api.post("/api/documents", {
        title: file.name.replace(/\.[^/.]+$/, ""),
        content
      });

      router.push(`/editor/${res.data.id}`);
    } catch (err) {
      console.error("Failed to import file", err);
    }
  };

  const handleDeleteDocument = async (e: React.MouseEvent, docId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      await api.delete(`/api/documents/${docId}`);
      setDocuments(prev => prev.filter(d => d.id !== docId));
    } catch (err) {
      console.error("Failed to delete document", err);
    }
  };

  const toggleStar = (e: React.MouseEvent, docId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setStarredIds(prev =>
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    );
  };

  const getSnippetText = (contentStr: string) => {
    try {
      const parsed = JSON.parse(contentStr);
      if (parsed.content && Array.isArray(parsed.content)) {
        for (const item of parsed.content) {
          if (item.content && Array.isArray(item.content)) {
            for (const child of item.content) {
              if (child.text && child.text.trim()) {
                return child.text.slice(0, 90) + "...";
              }
            }
          }
        }
      }
    } catch {}
    return "This is your starting point. Start writing something amazing.";
  };

  const ownedCount = documents.filter(d => d.isOwned).length;
  const sharedCount = documents.filter(d => !d.isOwned).length;
  const starredCount = documents.filter(d => starredIds.includes(d.id)).length;

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeNav === "shared" || filter === "shared") return matchesSearch && !doc.isOwned;
    if (activeNav === "starred" || filter === "starred") return matchesSearch && starredIds.includes(doc.id);
    if (filter === "owned") return matchesSearch && doc.isOwned;
    return matchesSearch;
  });

  if (authLoading || (!user && loading)) {
    return (
      <div className="min-h-screen bg-[#040512] flex items-center justify-center text-slate-400 font-sans">
        Loading FastDocs workspace...
      </div>
    );
  }

  const userName = user?.name || user?.email.split("@")[0] || "User";
  const userInitials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").toUpperCase()
    : user?.email.slice(0, 2).toUpperCase() || "FD";

  return (
    <div className="min-h-screen bg-[#050614] text-slate-100 flex font-sans overflow-x-hidden">
      
      {/* LEFT SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-[#07081b] border-r border-[#151733] flex flex-col justify-between p-5 shrink-0 hidden md:flex min-h-screen">
        <div className="space-y-6">
          {/* Brand Logo */}
          <div className="flex items-center space-x-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">FastDocs</span>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1">
            <button
              onClick={() => { setActiveNav("library"); setFilter("all"); }}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                activeNav === "library" && filter === "all"
                  ? "bg-[#14163c] text-indigo-300 font-semibold border border-[#22255c]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-[#0c0d29]"
              }`}
            >
              <Folder className="w-4 h-4" />
              <span>My Library</span>
            </button>

            <button
              onClick={() => { setActiveNav("shared"); setFilter("shared"); }}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                activeNav === "shared"
                  ? "bg-[#14163c] text-indigo-300 font-semibold border border-[#22255c]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-[#0c0d29]"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Shared with me</span>
            </button>

            <button
              onClick={() => { setActiveNav("starred"); setFilter("starred"); }}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                activeNav === "starred"
                  ? "bg-[#14163c] text-indigo-300 font-semibold border border-[#22255c]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-[#0c0d29]"
              }`}
            >
              <Star className="w-4 h-4" />
              <span>Starred</span>
            </button>

            <button
              onClick={() => setActiveNav("trash")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                activeNav === "trash"
                  ? "bg-[#14163c] text-indigo-300 font-semibold border border-[#22255c]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-[#0c0d29]"
              }`}
            >
              <Trash className="w-4 h-4" />
              <span>Trash</span>
            </button>
          </nav>

          {/* Workspaces Section */}
          <div className="pt-4 space-y-2">
            <div className="flex items-center justify-between px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <span>Workspaces</span>
              <button className="text-slate-500 hover:text-slate-300 text-sm font-normal">+</button>
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-3 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-[#0c0d29] rounded-xl cursor-pointer">
                <span className="w-5 h-5 rounded-full bg-purple-600/30 text-purple-400 border border-purple-500/40 flex items-center justify-center font-bold text-[10px]">P</span>
                <span>Product Team</span>
              </div>
              <div className="flex items-center space-x-3 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-[#0c0d29] rounded-xl cursor-pointer">
                <span className="w-5 h-5 rounded-full bg-teal-600/30 text-teal-400 border border-teal-500/40 flex items-center justify-center font-bold text-[10px]">D</span>
                <span>Design Team</span>
              </div>
              <div className="flex items-center space-x-3 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-[#0c0d29] rounded-xl cursor-pointer">
                <span className="w-5 h-5 rounded-full bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-[10px]">E</span>
                <span>Engineering</span>
              </div>
              <div className="flex items-center space-x-3 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-[#0c0d29] rounded-xl cursor-pointer">
                <span className="w-5 h-5 rounded-full bg-amber-600/30 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold text-[10px]">M</span>
                <span>Marketing</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Upgrade Card & Storage */}
        <div className="space-y-4 pt-4 border-t border-[#151733]">
          {/* Upgrade Card */}
          <div className="p-4 rounded-2xl bg-[#0c0d2a] border border-[#1b1d4a] space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-100">Upgrade to Pro</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Get unlimited docs, teams and advanced features.
            </p>
            <button className="w-full py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs transition-colors shadow-md shadow-indigo-600/20">
              Upgrade Now
            </button>
          </div>

          {/* Storage Bar */}
          <div className="space-y-2 px-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <div className="flex items-center space-x-1.5">
                <Cloud className="w-3.5 h-3.5 text-slate-400" />
                <span>Storage</span>
              </div>
              <span className="text-slate-300">2.4 GB / 10 GB</span>
            </div>
            <div className="w-full bg-[#121336] h-1.5 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full w-[24%] rounded-full" />
            </div>
          </div>
        </div>
      </aside>

      {/* RIGHT MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* TOP MAIN HEADER */}
        <header className="p-6 lg:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-2">
              <span>Welcome back, {userName}</span>
              <span className="inline-block animate-bounce">👋</span>
            </h1>
            <p className="text-xs lg:text-sm text-slate-400 mt-1">
              Here's what's happening with your documents today.
            </p>
          </div>

          {/* Top Bar Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Top Search Input */}
            <div className="relative hidden sm:block">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 py-2 rounded-xl bg-[#0b0c26] border border-[#1b1c44] text-slate-100 placeholder-slate-500 text-xs w-48 lg:w-64 focus:outline-none focus:border-indigo-500"
              />
              <div className="absolute right-2.5 top-2 flex items-center space-x-0.5 px-1.5 py-0.5 rounded bg-[#15173a] text-[10px] text-slate-400 border border-[#222552]">
                <Command className="w-2.5 h-2.5" />
                <span>K</span>
              </div>
            </div>

            {/* Notification Bell */}
            <button className="p-2 rounded-xl bg-[#0b0c26] border border-[#1b1c44] text-slate-400 hover:text-white transition-colors">
              <Bell className="w-4 h-4" />
            </button>

            {/* User Avatar */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 border-2 border-[#1f2150] flex items-center justify-center text-xs font-bold text-white shadow-md"
              >
                {userInitials}
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[#090a20] border border-[#1a1c40] rounded-xl p-2 shadow-2xl z-50 space-y-1">
                  <div className="px-3 py-2 text-xs border-b border-[#181a38]">
                    <div className="font-semibold text-slate-200">{userName}</div>
                    <div className="text-slate-500 text-[10px] truncate">{user?.email}</div>
                  </div>
                  <button
                    onClick={() => logout()}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-xs text-rose-400 hover:bg-rose-950/40 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>

            {/* Import Button */}
            <label className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#0b0c26] hover:bg-[#121438] border border-[#1c1e48] text-slate-200 text-xs font-semibold cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5 text-slate-400" />
              <span>Import .txt / .md</span>
              <input
                type="file"
                accept=".txt,.md,.markdown"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>

            {/* New Document Button */}
            <button
              onClick={handleCreateDocument}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-indigo-600/25 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>New Document</span>
            </button>
          </div>
        </header>

        {/* MAIN BODY CONTENT */}
        <main className="px-6 lg:px-8 pb-12 space-y-8 flex-1">
          
          {/* HERO BANNER */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0d0e2e] via-[#101238] to-[#17194c] border border-[#1f2258] p-8 lg:p-10 shadow-2xl flex items-center justify-between">
            <div className="space-y-2 max-w-lg z-10">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Your documents. Organized beautifully.
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Create, collaborate and manage documents with speed and clarity.
              </p>
            </div>

            {/* 3D Decorative Folder Graphic */}
            <div className="hidden md:flex relative items-center justify-center w-48 h-32 shrink-0">
              <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
              <div className="relative transform rotate-[-6deg] hover:rotate-0 transition-transform duration-500">
                <div className="w-28 h-36 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-400 shadow-2xl p-4 flex flex-col justify-between border border-indigo-300/40">
                  <div className="space-y-1.5">
                    <div className="w-12 h-2 rounded bg-white/70" />
                    <div className="w-16 h-1.5 rounded bg-white/40" />
                    <div className="w-10 h-1.5 rounded bg-white/40" />
                  </div>
                  <FileText className="w-8 h-8 text-white opacity-80 self-end" />
                </div>
                <div className="absolute -bottom-2 -left-6 w-32 h-24 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-xl border border-purple-400/40 flex items-center justify-center transform -rotate-6">
                  <Folder className="w-10 h-10 text-white fill-white/20" />
                </div>
              </div>
            </div>
          </div>

          {/* SEARCH, FILTER TABS & VIEW TOGGLE */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Search Input Bar */}
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#090a20] border border-[#191b40] text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Filter Tabs & Grid/List View Toggles */}
            <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-end">
              <div className="flex items-center space-x-1 bg-[#090a20] p-1 rounded-xl border border-[#191b40]">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filter === "all"
                      ? "bg-[#252869] text-white shadow-sm border border-[#35398a]"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  All ({documents.length})
                </button>
                <button
                  onClick={() => setFilter("owned")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filter === "owned"
                      ? "bg-[#252869] text-white shadow-sm border border-[#35398a]"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Owned by me ({ownedCount})
                </button>
                <button
                  onClick={() => setFilter("shared")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filter === "shared"
                      ? "bg-[#252869] text-white shadow-sm border border-[#35398a]"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Shared ({sharedCount})
                </button>
              </div>

              {/* View Toggles */}
              <div className="flex items-center space-x-1 bg-[#090a20] p-1 rounded-xl border border-[#191b40]">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === "grid" ? "bg-[#252869] text-white" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === "list" ? "bg-[#252869] text-white" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* DOCUMENT CARDS GRID / LIST VIEW */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-52 bg-[#090a20]/60 rounded-2xl animate-pulse border border-[#191b40]" />
              ))}
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-20 space-y-4 bg-[#090a20]/60 border border-[#191b40] rounded-3xl">
              <div className="w-16 h-16 rounded-2xl bg-[#0e1030] border border-[#1e2050] flex items-center justify-center mx-auto text-slate-500">
                <FileText className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-200">No documents found</h3>
                <p className="text-xs text-slate-500">
                  {searchQuery ? "No documents match your search criteria." : "Create your first document to get started."}
                </p>
              </div>
              {!searchQuery && (
                <button
                  onClick={handleCreateDocument}
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Document</span>
                </button>
              )}
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDocuments.map(doc => {
                const isStarred = starredIds.includes(doc.id);
                return (
                  <Link
                    key={doc.id}
                    href={`/editor/${doc.id}`}
                    className="group relative bg-[#0a0b22] border border-[#181a3e] hover:border-indigo-500/40 p-6 rounded-2xl transition-all hover:shadow-2xl hover:shadow-indigo-500/10 flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      {/* Top Badges Row */}
                      <div className="flex items-center justify-between">
                        <div className="w-9 h-9 rounded-xl bg-[#14163c] border border-[#22255c] flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                          <FileText className="w-4 h-4" />
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-[#121436] border border-[#202356] text-xs font-medium text-slate-300">
                            <UserCheck className="w-3 h-3 text-indigo-400" />
                            <span>{doc.isOwned ? "Owned" : "Shared"}</span>
                          </span>

                          {doc.isOwned && (
                            <button
                              onClick={(e) => handleDeleteDocument(e, doc.id)}
                              title="Delete Document"
                              className="p-1 rounded-lg text-slate-500 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Content Info */}
                      <div className="space-y-1">
                        <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                          {doc.title || "Untitled Document"}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {doc.isOwned ? "Created by you" : `Shared by ${doc.owner?.name || doc.owner?.email}`}
                        </p>
                        <p className="text-xs text-slate-400 pt-2 leading-relaxed line-clamp-2">
                          {getSnippetText(doc.content)}
                        </p>
                      </div>
                    </div>

                    {/* Footer Date & Star */}
                    <div className="pt-4 border-t border-[#141638] flex items-center justify-between text-xs text-slate-500 mt-6">
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(doc.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      </div>

                      <button
                        onClick={(e) => toggleStar(e, doc.id)}
                        className="p-1 text-slate-500 hover:text-amber-400 transition-colors"
                      >
                        <Star className={`w-4 h-4 ${isStarred ? "fill-amber-400 text-amber-400" : ""}`} />
                      </button>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            /* LIST VIEW */
            <div className="space-y-3">
              {filteredDocuments.map(doc => (
                <Link
                  key={doc.id}
                  href={`/editor/${doc.id}`}
                  className="flex items-center justify-between p-4 rounded-2xl bg-[#0a0b22] border border-[#181a3e] hover:border-indigo-500/40 transition-all hover:shadow-lg"
                >
                  <div className="flex items-center space-x-4 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#14163c] border border-[#22255c] flex items-center justify-center text-indigo-400 shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-white truncate">{doc.title || "Untitled Document"}</h3>
                      <p className="text-xs text-slate-500">
                        {doc.isOwned ? "Created by you" : `Shared by ${doc.owner?.name || doc.owner?.email}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 text-xs text-slate-500">
                    <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                    <button
                      onClick={(e) => toggleStar(e, doc.id)}
                      className="p-1 hover:text-amber-400 transition-colors"
                    >
                      <Star className={`w-4 h-4 ${starredIds.includes(doc.id) ? "fill-amber-400 text-amber-400" : ""}`} />
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
