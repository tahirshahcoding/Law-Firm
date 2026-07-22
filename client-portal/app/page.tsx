'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, Eye, EyeOff, ShieldAlert, Scale, ShieldCheck, Headphones, Shield, ArrowLeft } from 'lucide-react';
import Image from 'next/image';

import { API_BASE, getCsrfToken } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

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
        await fetch(`${API_BASE}/auth/logout/`, { 
          method: 'POST', 
          credentials: 'include',
          headers: {
            'X-CSRFToken': getCsrfToken()
          }
        });
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
    <div className="min-h-screen bg-[#faf9f6] flex flex-col relative font-sans overflow-hidden border-l-[12px] border-[#0A192F]">

      {/* Floating Top Right Button */}
      <div className="absolute top-8 right-8 z-50">
        <a 
          href="https://lawsiteswat.vercel.app" 
          className="flex items-center gap-2 bg-white/50 backdrop-blur border border-slate-200/60 px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-white hover:shadow-md transition-all duration-300"
        >
          <ArrowLeft size={16} /> Back to Website
        </a>
      </div>

      {/* Decorative leaf branch (SVG replacement for branch graphic) */}
      <div className="absolute bottom-0 right-0 z-0 opacity-10 pointer-events-none w-[600px] h-[600px] translate-x-1/4 translate-y-1/4">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path fill="#C1A774" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,81.3,-46.3C90.8,-33.5,96.8,-18,97.7,-2.1C98.6,13.8,94.4,30.1,85.2,43.8C76,57.5,61.8,68.7,46.1,76.5C30.4,84.3,13.2,88.7,-3.3,94C-19.8,99.3,-35.6,105.5,-50,100C-64.4,94.5,-77.4,77.3,-84.9,60C-92.4,42.7,-94.4,25.3,-92.4,9.2C-90.4,-6.9,-84.4,-21.7,-75.7,-34C-67,-46.3,-55.6,-56.1,-42.6,-63.9C-29.6,-71.7,-15,-77.5,-0.1,-77.3C14.8,-77.1,29.6,-70.9,44.7,-76.4Z" transform="translate(100 100)" />
        </svg>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-10">
        
        {/* Main Card */}
        <div className="w-full max-w-[460px] bg-white rounded-[24px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.06)] p-10 pt-14 border border-slate-100/80 relative">
          
          {/* Logo Badge (Floating above card) */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2">
            <div className="relative w-20 h-20 bg-[#0A192F] rounded-full flex items-center justify-center shadow-lg border-[3px] border-white overflow-hidden">
              <Image src="/logo.png" alt="Rahimullah Advocate Logo" fill sizes="80px" className="object-cover scale-[1.15]" priority />
            </div>
          </div>

          <div className="text-center mb-10 mt-4">
            <h1 className="font-serif text-[32px] text-[#0A192F] font-semibold mb-2 tracking-tight">Welcome Back</h1>
            <p className="text-[#C1A774] text-xs font-bold uppercase tracking-[0.2em]">Client Portal</p>
            
            {/* Elegant Divider */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <div className="h-[1px] w-12 bg-slate-200"></div>
              <Scale size={20} className="text-[#C1A774]" strokeWidth={1.5} />
              <div className="h-[1px] w-12 bg-slate-200"></div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            
            {error && (
              <div className="flex items-start gap-3 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
                <ShieldAlert size={17} className="shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {/* Username Input */}
            <div className="space-y-2">
              <label className="block text-[13px] font-bold text-slate-700 ml-1">Client ID / Username</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#C1A774] transition-colors" size={18} strokeWidth={2} />
                <input
                  type="text"
                  required
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  placeholder="e.g. C-001"
                  className="w-full bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 rounded-xl pl-12 pr-4 py-3.5 text-[15px] focus:outline-none focus:ring-4 focus:ring-[#C1A774]/10 focus:border-[#C1A774] transition-all shadow-sm shadow-slate-100/50"
                  suppressHydrationWarning
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="block text-[13px] font-bold text-slate-700 ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#C1A774] transition-colors" size={18} strokeWidth={2} />
                <input
                  type={showPwd ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="Enter your password"
                  className="w-full bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 rounded-xl pl-12 pr-12 py-3.5 text-[15px] focus:outline-none focus:ring-4 focus:ring-[#C1A774]/10 focus:border-[#C1A774] transition-all shadow-sm shadow-slate-100/50"
                  suppressHydrationWarning
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  suppressHydrationWarning
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Options Row */}
            <div className="flex items-center justify-between pt-1 pb-2">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="remember" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-[#C1A774] border-slate-300 focus:ring-[#C1A774] cursor-pointer" 
                />
                <label htmlFor="remember" className="text-xs font-semibold text-slate-600 cursor-pointer">Remember me</label>
              </div>
              <a href="tel:03459309670" className="text-xs font-bold text-[#C1A774] hover:text-[#a89063] transition-colors">
                Forgot Password?
              </a>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0A192F] hover:bg-[#112440] disabled:opacity-70 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-[#0A192F]/20 flex items-center justify-center gap-3 text-sm tracking-widest uppercase mt-4"
              suppressHydrationWarning
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                   <ArrowLeft size={18} /> SIGN IN
                </>
              )}
            </button>
          </form>

          {/* OR Divider */}
          <div className="flex items-center justify-center gap-4 my-8">
            <div className="h-[1px] flex-1 bg-slate-100"></div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">OR</span>
            <div className="h-[1px] flex-1 bg-slate-100"></div>
          </div>

          {/* Contact Office Button */}
          <a href="tel:03459309670" className="w-full bg-white border border-[#C1A774] text-[#C1A774] hover:bg-[#C1A774] hover:text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-3 text-[13px] tracking-widest uppercase">
            <Headphones size={18} /> CONTACT OUR OFFICE
          </a>

        </div>
      </div>

      {/* Trust Badges Footer */}
      <div className="w-full flex justify-center pb-12 relative z-10 px-4">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
          
          <div className="flex items-center gap-3">
            <ShieldCheck size={28} className="text-[#C1A774]" strokeWidth={1.5} />
            <div>
              <p className="font-bold text-slate-800 text-xs">Secure Access</p>
              <p className="text-[10px] text-slate-500">256-bit SSL encryption</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <User size={28} className="text-[#C1A774]" strokeWidth={1.5} />
            <div>
              <p className="font-bold text-slate-800 text-xs">Confidential</p>
              <p className="text-[10px] text-slate-500">Attorney-Client Privilege</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Shield size={28} className="text-[#C1A774]" strokeWidth={1.5} />
            <div>
              <p className="font-bold text-slate-800 text-xs">Trusted Support</p>
              <p className="text-[10px] text-slate-500">We are here to help</p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
