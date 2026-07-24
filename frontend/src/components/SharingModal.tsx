"use client";

import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { X, UserPlus, Trash2, Shield, Eye, Edit3, MessageSquare, Crown, Copy, Check } from "lucide-react";

interface SharedUser {
  id: string;
  userId: string;
  permission: "admin" | "editor" | "commenter" | "viewer" | "view" | "edit";
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface SharingModalProps {
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function SharingModal({ documentId, isOpen, onClose }: SharingModalProps) {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<"admin" | "editor" | "commenter" | "viewer">("viewer");
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const fetchSharedUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/documents/${documentId}/share`);
      setSharedUsers(res.data.sharedWith || []);
    } catch (err: any) {
      console.error(err);
      setSharedUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && documentId) {
      fetchSharedUsers();
      setError(null);
      setSuccess(null);
    }
  }, [isOpen, documentId]);

  if (!isOpen) return null;

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setError(null);
    setSuccess(null);
    setSharing(true);

    try {
      await api.post(`/api/documents/${documentId}/share`, {
        email: email.trim(),
        permission
      });
      setSuccess(`✓ Access granted to ${email.trim()} as ${permission}`);
      setEmail("");
      fetchSharedUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to share document. Check the email is registered.");
    } finally {
      setSharing(false);
    }
  };

  const handleRevoke = async (userId: string, userEmail: string) => {
    if (!confirm(`Remove access for ${userEmail}?`)) return;
    try {
      await api.delete(`/api/documents/${documentId}/share/${userId}`);
      setSharedUsers(prev => prev.filter(u => u.userId !== userId));
      setSuccess(`Revoked access for ${userEmail}`);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to revoke access");
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const roleMeta: Record<string, { label: string; color: string; bg: string; border: string }> = {
    admin:     { label: "Admin",     color: "#c084fc", bg: "rgba(126,34,206,0.15)", border: "rgba(168,85,247,0.3)" },
    editor:    { label: "Editor",    color: "#34d399", bg: "rgba(5,150,105,0.15)",  border: "rgba(52,211,153,0.3)" },
    edit:      { label: "Editor",    color: "#34d399", bg: "rgba(5,150,105,0.15)",  border: "rgba(52,211,153,0.3)" },
    commenter: { label: "Commenter", color: "#818cf8", bg: "rgba(79,70,229,0.15)",  border: "rgba(129,140,248,0.3)" },
    viewer:    { label: "Viewer",    color: "#94a3b8", bg: "rgba(51,65,85,0.4)",    border: "rgba(100,116,139,0.3)" },
    view:      { label: "Viewer",    color: "#94a3b8", bg: "rgba(51,65,85,0.4)",    border: "rgba(100,116,139,0.3)" },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(5,6,20,0.85)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-5" style={{ background: '#07081b', border: '1px solid #1a1c42' }}>
        {/* Header */}
        <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid #151733' }}>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(79,70,229,0.2)', border: '1px solid rgba(99,102,241,0.3)' }}>
              <Shield className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Share Document</h3>
              <p className="text-[11px] text-slate-500">Invite collaborators with role-based access</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
            style={{ background: 'transparent' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#1a1c42')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-3 rounded-xl text-rose-300 text-sm" style={{ background: 'rgba(136,19,55,0.2)', border: '1px solid rgba(244,63,94,0.3)' }}>
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 rounded-xl text-emerald-300 text-sm" style={{ background: 'rgba(6,95,70,0.2)', border: '1px solid rgba(52,211,153,0.3)' }}>
            {success}
          </div>
        )}

        {/* Share Form */}
        <form onSubmit={handleShare} className="space-y-3">
          <label className="block text-sm font-semibold text-slate-200">Invite by email</label>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 px-3.5 py-2.5 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none"
              style={{ background: '#090a1f', border: '1px solid #1e2050' }}
            />
            <select
              value={permission}
              onChange={(e) => setPermission(e.target.value as any)}
              className="px-3 py-2 rounded-xl text-slate-200 text-sm focus:outline-none"
              style={{ background: '#090a1f', border: '1px solid #1e2050' }}
            >
              <option value="viewer">Viewer</option>
              <option value="commenter">Commenter</option>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={sharing || !email.trim()}
            className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>{sharing ? "Inviting..." : "Send Invite"}</span>
          </button>
        </form>

        {/* Copy link */}
        <button
          onClick={handleCopyLink}
          className="w-full flex items-center justify-center space-x-2 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-medium transition-colors"
          style={{ background: '#090a1f', border: '1px solid #1a1c42' }}
        >
          {linkCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{linkCopied ? "Link copied!" : "Copy document link"}</span>
        </button>

        {/* Collaborators */}
        <div className="space-y-2 pt-1">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Collaborators ({sharedUsers.length})
          </h4>

          {loading ? (
            <div className="flex items-center justify-center py-6">
              <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            </div>
          ) : sharedUsers.length === 0 ? (
            <div className="py-6 text-center text-sm text-slate-500 italic rounded-xl" style={{ background: 'rgba(9,10,31,0.5)', border: '1px solid #1a1c42' }}>
              Only you have access to this document.
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-2">
              {sharedUsers.map((item) => {
                const meta = roleMeta[item.permission] ?? roleMeta.viewer;
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-xl"
                    style={{ background: '#090a1f', border: '1px solid #1a1c42' }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-300">
                        {item.user.name ? item.user.name.charAt(0).toUpperCase() : item.user.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-200">
                          {item.user.name || item.user.email}
                        </div>
                        <div className="text-xs text-slate-500">{item.user.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded-md text-xs font-semibold" style={{ color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }}>
                        {meta.label}
                      </span>
                      <button
                        onClick={() => handleRevoke(item.userId, item.user.email)}
                        title="Revoke access"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
