'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Scale, Lock, User, Eye, EyeOff, ShieldAlert } from 'lucide-react';

const API = 'http://localhost:8000/api';

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
      // Dedicated portal token endpoint
      const res = await fetch(`${API}/portal/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setError('Invalid username or password. Please try again.');
        return;
      }

      // Verify this is a Client account (block staff from using this portal)
      const meRes = await fetch(`${API}/users/me/`, {
        headers: { Authorization: `Bearer ${data.access}` },
      });
      const me = await meRes.json();

      if (me.role !== 'Client') {
        setError('This portal is for clients only. Staff must use the staff system.');
        return;
      }

      // Store tokens in sessionStorage (tab-scoped, cleared on tab close)
      sessionStorage.setItem('cp_access', data.access);
      sessionStorage.setItem('cp_refresh', data.refresh);

      router.push('/dashboard');
    } catch {
      setError('Could not connect to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex flex-col">

      {/* ── Top bar ── */}
      <header className="flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-blue-700 rounded-xl flex items-center justify-center">
            <Scale size={18} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-none">EagleNest Legal</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Client Portal</p>
          </div>
        </div>
        <a
          href="http://localhost:3000/home"
          className="text-slate-500 hover:text-slate-300 text-xs transition-colors"
        >
          ← Back to website
        </a>
      </header>

      {/* ── Login card ── */}
      <div className="flex-1 flex items-center justify-center px-4 pb-20">
        <div className="w-full max-w-sm">

          {/* Badge */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-900/60 mb-5 ring-4 ring-white/5">
              <Scale size={36} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Client Portal Login</h1>
            <p className="text-slate-400 text-sm mt-2 text-center">
              Sign in to view your case status and hearing schedule.
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleLogin}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-7 space-y-5 shadow-2xl"
          >
            {error && (
              <div className="flex items-start gap-3 p-3.5 bg-rose-500/10 border border-rose-500/25 rounded-xl text-rose-300 text-sm">
                <ShieldAlert size={17} className="shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Client Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" size={17} />
                <input
                  type="text"
                  required
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  placeholder="e.g. C-001"
                  className="w-full bg-white/8 border border-white/10 text-white placeholder:text-slate-600 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
                />
              </div>
              <p className="text-[11px] text-slate-600 mt-1.5">Your username was provided by the office.</p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" size={17} />
                <input
                  type={showPwd ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="Your provided password"
                  className="w-full bg-white/8 border border-white/10 text-white placeholder:text-slate-600 rounded-xl pl-10 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                >
                  {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-900/50 flex items-center justify-center gap-2 mt-1"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="text-center text-slate-600 text-xs mt-6">
            Forgot your credentials? Contact the office directly.
          </p>
        </div>
      </div>
    </div>
  );
}
