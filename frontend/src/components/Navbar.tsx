"use client";

import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { FileText, LogOut, User as UserIcon, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export function Navbar({ onCreateDocument }: { onCreateDocument?: () => void }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="glass-header border-b border-slate-800/80 px-4 lg:px-8 py-3.5 flex items-center justify-between">
      <div className="flex items-center space-x-6">
        <Link href="/" className="flex items-center space-x-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            FastDocs
          </span>
        </Link>
      </div>

      <div className="flex items-center space-x-4">
        {user ? (
          <>
            {onCreateDocument && (
              <button
                onClick={onCreateDocument}
                className="hidden sm:flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-medium text-sm transition-all shadow-md shadow-brand-600/20 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>New Doc</span>
              </button>
            )}

            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-300">
              <div className="w-6 h-6 rounded-full bg-brand-900/60 border border-brand-500/40 flex items-center justify-center text-brand-300 text-xs font-semibold">
                {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
              </div>
              <span className="font-medium text-slate-200 max-w-[120px] sm:max-w-[180px] truncate">
                {user.name || user.email}
              </span>
            </div>

            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="flex items-center space-x-3">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium text-white bg-brand-600 hover:bg-brand-500 px-3.5 py-1.5 rounded-lg transition-colors shadow-md shadow-brand-600/20"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
