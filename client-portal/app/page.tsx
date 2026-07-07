'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import Image from 'next/image';

import { API_BASE } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // POST credentials to the dedicated portal token endpoint.
      // Django sets httpOnly access_token + refresh_token cookies on success.
      // credentials: 'include' is required so the browser accepts the Set-Cookie header.
      const res = await fetch(`${API_BASE}/portal/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
        credentials: 'include',
      });

      if (!res.ok) {
        setError('Invalid username or password. Please try again.');
        return;
      }

      // Verify this is a Client account (block staff from using this portal)
      const meRes = await fetch(`${API_BASE}/users/me/`, {
        credentials: 'include',  // sends the newly set cookie
      });
      const me = await meRes.json();

      if (me.role !== 'Client') {
        // Clear the cookie immediately — staff must use the staff system
        await fetch(`${API_BASE}/auth/logout/`, { method: 'POST', credentials: 'include' });
        setError('This portal is for clients only. Staff must use the staff system.');
        return;
      }

      router.push('/dashboard');
    } catch {
      setError('Could not connect to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* ── Top bar ── */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-slate-200/60 bg-white shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 border border-slate-100 shadow-sm">
            <Image src="/logo.png" alt="Rahimullah Advocate Logo" fill className="object-cover scale-[1.15]" sizes="40px" />
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm leading-none">Rahimullah Advocate</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5 font-semibold">Client Portal</p>
          </div>
        </div>
        <a
          href="https://lawsiteswat.vercel.app"
          className="text-slate-500 hover:text-slate-800 text-xs font-medium transition-colors"
        >
          ← Back to website
        </a>
      </header>

      {/* ── Login card ── */}
      <div className="flex-1 flex items-center justify-center px-4 pb-20">
        <div className="w-full max-w-sm">

          {/* Badge */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative w-24 h-24 rounded-3xl shadow-lg shadow-slate-200 mb-5 border border-slate-100 overflow-hidden bg-white">
              <Image src="/logo.png" alt="Rahimullah Advocate Logo" fill className="object-cover scale-[1.15]" sizes="96px" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Client Portal Login</h1>
            <p className="text-slate-500 text-sm mt-2 text-center">
              Sign in to view your case status and hearing schedule.
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleLogin}
            className="bg-white border border-slate-200 rounded-2xl p-7 space-y-5 shadow-xl shadow-slate-200/50"
          >
            {error && (
              <div className="flex items-start gap-3 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
                <ShieldAlert size={17} className="shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {/* Username */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Client Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input
                  type="text"
                  required
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  placeholder="e.g. C-001"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
                  suppressHydrationWarning
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5 font-medium">Your username was provided by the office.</p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input
                  type={showPwd ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="Your provided password"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl pl-10 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
                  suppressHydrationWarning
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  suppressHydrationWarning
                >
                  {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 mt-2"
              suppressHydrationWarning
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="text-center text-slate-500 text-xs mt-6 font-medium">
            Forgot your credentials? Contact the office directly.
          </p>
        </div>
      </div>
    </div>
  );
}
