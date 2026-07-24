"use client";

import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { History, X, RotateCcw, Plus, Clock, FileText } from "lucide-react";

interface VersionItem {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  createdBy: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface VersionHistoryDrawerProps {
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
  onRestoreVersion: (restoredDoc: any) => void;
  canEdit: boolean;
}

export function VersionHistoryDrawer({
  documentId,
  isOpen,
  onClose,
  onRestoreVersion,
  canEdit
}: VersionHistoryDrawerProps) {
  const [versions, setVersions] = useState<VersionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<VersionItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchVersions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/api/documents/${documentId}/versions`);
      const data = res.data || [];
      setVersions(data);
      if (data.length > 0) setSelectedVersion(data[0]);
    } catch (err) {
      console.error("Failed to load versions", err);
      setError("Could not load version history. Make sure the backend is running.");
      setVersions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && documentId) {
      fetchVersions();
    }
  }, [isOpen, documentId]);

  if (!isOpen) return null;

  const handleCreateSnapshot = async () => {
    try {
      setCreating(true);
      setError(null);
      const res = await api.post(`/api/documents/${documentId}/versions`);
      setVersions(prev => [res.data, ...prev]);
      setSelectedVersion(res.data);
    } catch (err) {
      console.error("Failed to create snapshot", err);
      setError("Failed to save snapshot. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = async (versionId: string) => {
    if (!confirm("Restore this version? The current state will be saved automatically before restoring.")) return;

    try {
      setRestoring(versionId);
      setError(null);
      const res = await api.post(`/api/documents/${documentId}/versions/${versionId}/restore`);
      onRestoreVersion(res.data);
      onClose();
    } catch (err) {
      console.error("Failed to restore version", err);
      setError("Failed to restore version. Please try again.");
    } finally {
      setRestoring(null);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md flex flex-col shadow-2xl" style={{ background: '#07081b', borderLeft: '1px solid #151733' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid #151733' }}>
        <div className="flex items-center space-x-2">
          <History className="w-5 h-5 text-indigo-400" />
          <h3 className="font-bold text-slate-100 text-base">Version History</h3>
          {versions.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600/30 text-indigo-300 border border-indigo-500/30">
              {versions.length}
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

      {/* Error Banner */}
      {error && (
        <div className="mx-4 mt-3 p-3 rounded-xl text-xs text-rose-300" style={{ background: 'rgba(136,19,55,0.2)', border: '1px solid rgba(244,63,94,0.3)' }}>
          {error}
        </div>
      )}

      {/* Save Snapshot Action */}
      {canEdit && (
        <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid #151733', background: 'rgba(9,10,31,0.4)' }}>
          <div>
            <div className="text-xs font-semibold text-slate-200">Save a snapshot</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Bookmark the current document state</div>
          </div>
          <button
            onClick={handleCreateSnapshot}
            disabled={creating}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{creating ? "Saving..." : "Save Snapshot"}</span>
          </button>
        </div>
      )}

      {/* Versions List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2 text-slate-400 text-sm">
              <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
              <span>Loading history...</span>
            </div>
          </div>
        ) : versions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center">
              <History className="w-7 h-7 text-indigo-500/60" />
            </div>
            <p className="text-slate-400 text-sm font-medium">No snapshots saved</p>
            <p className="text-slate-600 text-xs max-w-[220px]">
              {canEdit ? 'Click "Save Snapshot" above to create your first version checkpoint.' : 'No version history available for this document.'}
            </p>
          </div>
        ) : (
          versions.map((ver, idx) => {
            const isSelected = selectedVersion?.id === ver.id;
            const isRestoring = restoring === ver.id;
            return (
              <div
                key={ver.id}
                onClick={() => setSelectedVersion(ver)}
                className="p-4 rounded-2xl border cursor-pointer transition-all"
                style={{
                  background: isSelected ? '#090a1f' : 'rgba(9,10,31,0.5)',
                  borderColor: isSelected ? '#4f46e5' : '#1a1c42'
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <div className="text-sm font-bold text-slate-200 truncate">{ver.title}</div>
                      {idx === 0 && (
                        <span className="shrink-0 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
                          Latest
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1.5 text-[11px] text-slate-500">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(ver.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="text-[11px] text-slate-600">
                      by {ver.createdBy?.name || ver.createdBy?.email || "Unknown"}
                    </div>
                  </div>

                  {canEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRestore(ver.id);
                      }}
                      disabled={isRestoring}
                      title="Restore this version"
                      className="ml-2 shrink-0 flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-indigo-300 text-xs font-semibold transition-colors disabled:opacity-50"
                      style={{ background: '#1a1c42' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#22265c')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#1a1c42')}
                    >
                      <RotateCcw className={`w-3 h-3 ${isRestoring ? 'animate-spin' : ''}`} />
                      <span>{isRestoring ? "..." : "Restore"}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
