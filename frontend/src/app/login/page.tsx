"use client";

import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  ArrowRight,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  Crown,
  Users,
  Feather,
  Cloud,
  Quote,
  Star
} from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login(email, password);
      router.push("/");
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed. Check your credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  const fillSeededAccount = (userEmail: string) => {
    setEmail(userEmail);
    setPassword("password123");
  };

  return (
    <div className="min-h-screen w-full bg-[#050614] text-slate-100 flex items-center justify-center p-4 lg:p-8 relative overflow-hidden font-sans">
      {/* Background glow effects & dot grid overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e2048_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10 my-auto">
        
        {/* Left Side: Branding & Features */}
        <div className="lg:col-span-6 space-y-10 pr-0 lg:pr-6">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-white">FastDocs</span>
          </div>

          {/* Main Title & Subtitle */}
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-none text-white">
              Your documents. <br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Organized & Powerful.
              </span>
            </h1>
            <p className="text-slate-400 text-base leading-relaxed max-w-md">
              A modern document editor for teams and individuals. Create, collaborate, and get things done.
            </p>
          </div>

          {/* Feature List */}
          <div className="space-y-6 pt-2">
            {/* Feature 1 */}
            <div className="flex items-start space-x-4">
              <div className="w-11 h-11 rounded-2xl bg-[#0f102c] border border-[#1e2048] flex items-center justify-center text-purple-400 shrink-0 shadow-inner">
                <Feather className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-100">Rich Text Editing</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Create beautiful documents with advanced formatting and styling.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start space-x-4">
              <div className="w-11 h-11 rounded-2xl bg-[#0f102c] border border-[#1e2048] flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
                <Users className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-100">Real-time Collaboration</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Work together in real-time and see changes instantly.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-start space-x-4">
              <div className="w-11 h-11 rounded-2xl bg-[#0f102c] border border-[#1e2048] flex items-center justify-center text-blue-400 shrink-0 shadow-inner">
                <Cloud className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-100">Secure & Reliable</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Your data is encrypted and always protected.
                </p>
              </div>
            </div>
          </div>

          {/* Testimonial Card */}
          <div className="p-5 rounded-2xl bg-[#0b0c24]/90 border border-[#1c1e44] space-y-3 relative overflow-hidden backdrop-blur-md">
            <div className="flex items-center space-x-1.5 text-purple-400">
              <Quote className="w-5 h-5 rotate-180 fill-purple-400/20" />
            </div>
            <p className="text-xs text-slate-300 font-medium leading-relaxed">
              FastDocs has transformed the way our team writes and collaborates.
            </p>
            <div className="flex items-center justify-between pt-1">
              <div className="text-[11px] text-slate-400 font-medium">
                — <span className="text-slate-200 font-semibold">Sarah Johnson</span>, Project Manager
              </div>
              <div className="flex items-center space-x-0.5 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-amber-400" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Floating Login Card */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="w-full max-w-md bg-[#090a1e]/90 border border-[#1a1c3e] rounded-3xl p-8 lg:p-10 shadow-2xl space-y-6 backdrop-blur-xl relative">
            
            {/* Top Badge Icon */}
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-500 flex items-center justify-center shadow-xl shadow-indigo-500/30 mx-auto">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-white tracking-tight">Welcome back</h2>
                <p className="text-xs text-slate-400">Sign in to access your documents and workspace</p>
              </div>
            </div>

            {/* Demo Quick Access */}
            <div className="p-4 rounded-2xl bg-[#060716] border border-[#161732] space-y-2.5">
              <div className="text-[11px] font-semibold text-slate-400">Quick access (Demo accounts)</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fillSeededAccount("alice@test.com")}
                  className="flex items-center justify-center space-x-1.5 py-2.5 px-3 bg-[#0d0e2c] hover:bg-[#151740] border border-[#1d1f4d] rounded-xl text-slate-200 font-medium text-xs transition-colors"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>Alice (Owner)</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillSeededAccount("bob@test.com")}
                  className="flex items-center justify-center space-x-1.5 py-2.5 px-3 bg-[#0d0e2c] hover:bg-[#151740] border border-[#1d1f4d] rounded-xl text-slate-200 font-medium text-xs transition-colors"
                >
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Bob (Collaborator)</span>
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-[#181a3c] w-full" />
              <span className="bg-[#090a1e] px-3 text-[11px] text-slate-500 uppercase tracking-wider font-semibold absolute">
                or
              </span>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center space-x-2 p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Email address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#050614] border border-[#181a3c] text-white placeholder-slate-600 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#050614] border border-[#181a3c] text-white placeholder-slate-600 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember me & Forgot Password */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center space-x-2 text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded bg-[#050614] border-[#181a3c] text-indigo-600 focus:ring-0"
                  />
                  <span>Remember me</span>
                </label>
                <a href="#" onClick={(e) => e.preventDefault()} className="text-indigo-400 hover:underline font-medium">
                  Forgot password?
                </a>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center space-x-2 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30 active:scale-98"
              >
                <span>{submitting ? "Signing in..." : "Sign in"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Footer */}
            <div className="text-center text-xs text-slate-400 pt-2">
              Don't have an account?{" "}
              <Link href="/register" className="text-indigo-400 hover:underline font-semibold">
                Create an account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
