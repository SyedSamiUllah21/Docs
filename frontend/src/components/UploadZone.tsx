"use client";

import { useState } from "react";
import { api } from "../lib/api";
import { Paperclip, Upload, Download, Trash2, File, CheckCircle2, AlertCircle } from "lucide-react";

interface Attachment {
  id: string;
  filename: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
}

interface UploadZoneProps {
  documentId: string;
  attachments: Attachment[];
  onAttachmentAdded: (attachment: Attachment) => void;
  onAttachmentDeleted: (id: string) => void;
  readOnly?: boolean;
}

export function UploadZone({
  documentId,
  attachments,
  onAttachmentAdded,
  onAttachmentDeleted,
  readOnly = false
}: UploadZoneProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post(`/api/documents/${documentId}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      onAttachmentAdded(res.data);
      e.target.value = "";
    } catch (err: any) {
      setError(err.response?.data?.error || "File upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (attachment: Attachment) => {
    try {
      const res = await api.get(`/api/attachments/${attachment.id}`, {
        responseType: "blob"
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", attachment.filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Failed to download attachment", err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/attachments/${id}`);
      onAttachmentDeleted(id);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete attachment");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Paperclip className="w-4 h-4 text-brand-400" />
          <h3 className="text-sm font-semibold text-slate-200">Attachments ({attachments.length})</h3>
        </div>

        {!readOnly && (
          <label className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5" />
            <span>{uploading ? "Uploading..." : "Attach File"}</span>
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        )}
      </div>

      {error && (
        <div className="flex items-center space-x-2 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {attachments.length === 0 ? (
        <div className="text-xs text-slate-500 py-3 text-center italic">
          No files attached to this document.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {attachments.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 group hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                <File className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-medium text-slate-200 truncate" title={file.filename}>
                    {file.filename}
                  </div>
                  <div className="text-[10px] text-slate-500">{formatFileSize(file.fileSize)}</div>
                </div>
              </div>

              <div className="flex items-center space-x-1 shrink-0">
                <button
                  onClick={() => handleDownload(file)}
                  title="Download File"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                {!readOnly && (
                  <button
                    onClick={() => handleDelete(file.id)}
                    title="Delete File"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
