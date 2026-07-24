"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Users, Circle } from "lucide-react";

interface PresenceUser {
  id: string;
  userId: string;
  lastSeen: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface CollaborationBarProps {
  documentId: string;
}

export function CollaborationBar({ documentId }: CollaborationBarProps) {
  const [activeUsers, setActiveUsers] = useState<PresenceUser[]>([]);

  const heartbeatAndFetchPresence = async () => {
    try {
      // Send heartbeat
      await api.post(`/api/documents/${documentId}/presence`);
      // Fetch active online collaborators
      const res = await api.get(`/api/documents/${documentId}/presence`);
      setActiveUsers(res.data || []);
    } catch (err) {
      console.error("Presence error", err);
    }
  };

  useEffect(() => {
    if (documentId) {
      heartbeatAndFetchPresence();
      const interval = setInterval(heartbeatAndFetchPresence, 10000); // 10s heartbeat
      return () => clearInterval(interval);
    }
  }, [documentId]);

  if (activeUsers.length === 0) return null;

  return (
    <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-xs">
      <div className="flex items-center space-x-1.5 text-emerald-400 font-medium">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <Users className="w-3.5 h-3.5" />
      </div>

      <div className="flex items-center -space-x-1.5 overflow-hidden">
        {activeUsers.map((item) => {
          const initials = item.user.name
            ? item.user.name.charAt(0).toUpperCase()
            : item.user.email.charAt(0).toUpperCase();

          return (
            <div
              key={item.id}
              title={`${item.user.name || item.user.email} (Active now)`}
              className="w-6 h-6 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 border-2 border-slate-950 flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
            >
              {initials}
            </div>
          );
        })}
      </div>

      <span className="text-slate-400 font-medium text-[11px]">
        {activeUsers.length} online
      </span>
    </div>
  );
}
