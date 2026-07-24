"use client";

import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { MessageSquare, X, Send, CheckCircle2, Trash2, Clock } from "lucide-react";

interface CommentItem {
  id: string;
  content: string;
  resolved: boolean;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface CommentsSidebarProps {
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
  canComment: boolean;
}

export function CommentsSidebar({ documentId, isOpen, onClose, canComment }: CommentsSidebarProps) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/documents/${documentId}/comments`);
      setComments(res.data || []);
    } catch (err) {
      console.error("Failed to load comments", err);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && documentId) {
      fetchComments();
    }
  }, [isOpen, documentId]);

  if (!isOpen) return null;

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const res = await api.post(`/api/documents/${documentId}/comments`, {
        content: newComment.trim()
      });
      setComments(prev => [...prev, res.data]);
      setNewComment("");
    } catch (err) {
      console.error("Failed to post comment", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleResolve = async (commentId: string) => {
    try {
      const res = await api.patch(`/api/comments/${commentId}/resolve`);
      setComments(prev => prev.map(c => c.id === commentId ? res.data : c));
    } catch (err) {
      console.error("Failed to update comment status", err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await api.delete(`/api/comments/${commentId}`);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err) {
      console.error("Failed to delete comment", err);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm flex flex-col shadow-2xl" style={{ background: '#07081b', borderLeft: '1px solid #151733' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid #151733' }}>
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5 text-indigo-400" />
          <h3 className="font-bold text-slate-100 text-base">Comments</h3>
          {comments.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600/30 text-indigo-300 border border-indigo-500/30">
              {comments.length}
            </span>
          )}
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

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2 text-slate-400 text-sm">
              <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
              <span>Loading comments...</span>
            </div>
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center">
              <MessageSquare className="w-7 h-7 text-indigo-500/60" />
            </div>
            <p className="text-slate-400 text-sm font-medium">No comments yet</p>
            <p className="text-slate-600 text-xs max-w-[200px]">Start a discussion with your collaborators below.</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="p-3.5 rounded-2xl border transition-all"
              style={{
                background: comment.resolved ? 'rgba(9,10,31,0.4)' : '#090a1f',
                borderColor: comment.resolved ? '#1a1c42' : '#1e2050',
                opacity: comment.resolved ? 0.65 : 1
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-[10px] font-bold text-indigo-300">
                    {comment.author.name
                      ? comment.author.name.charAt(0).toUpperCase()
                      : comment.author.email.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-slate-200">
                    {comment.author.name || comment.author.email}
                  </span>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleToggleResolve(comment.id)}
                    title={comment.resolved ? "Reopen comment" : "Mark as resolved"}
                    className={`p-1 rounded-lg transition-colors ${
                      comment.resolved ? "text-emerald-400" : "text-slate-500 hover:text-emerald-400"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    title="Delete comment"
                    className="p-1 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                {comment.content}
              </p>

              <div className="flex items-center space-x-2 text-[10px] text-slate-600 mt-2">
                <Clock className="w-3 h-3" />
                <span>{new Date(comment.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                {comment.resolved && <span className="text-emerald-500 font-semibold">• Resolved</span>}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Comment Input */}
      {canComment ? (
        <form onSubmit={handleAddComment} className="p-4" style={{ borderTop: '1px solid #151733', background: 'rgba(5,6,20,0.8)' }}>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 px-3.5 py-2 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none"
              style={{ background: '#090a1f', border: '1px solid #1e2050' }}
            />
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4 text-center text-xs text-slate-500" style={{ borderTop: '1px solid #151733' }}>
          You have view-only access to this document.
        </div>
      )}
    </div>
  );
}
