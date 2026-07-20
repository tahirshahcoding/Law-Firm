'use client';

import { API_BASE } from '@/lib/api';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Lock, User, Eye, EyeOff, Briefcase, Calendar, FileText, DollarSign, Shield, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { Playfair_Display, Inter } from 'next/font/google';

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    let res: Response | null = null;
    try {
      res = await fetch(`${API_BASE}/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });
    } catch (networkErr: any) {
      setError(`Cannot reach the server. (${API_BASE})`);
      setIsLoading(false);
      return;
    }

    if (res.status === 401) {
      setError('Wrong username or password. Please try again.');
      setIsLoading(false);
      return;
    }

    if (res.status === 429) {
      setError('Too many login attempts. Please wait a minute.');
      setIsLoading(false);
      return;
    }

    if (res.status >= 500) {
      setError(`Server error (${res.status}). Please try again in a moment.`);
      setIsLoading(false);
      return;
    }

    if (!res.ok) {
      let detail = '';
      try { detail = (await res.json()).detail || ''; } catch {}
      setError(`Login failed (${res.status})${detail ? ': ' + detail : ''}`);
      setIsLoading(false);
      return;
    }

    try {
      await login();
    } catch (err: any) {
      setError('Logged in but failed to load your profile. Please refresh.');
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen w-full flex flex-col ${inter.className}`}>
      
      {/* Autofill CSS Override */}
      <style dangerouslySetInnerHTML={{__html: `
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active{
            -webkit-box-shadow: 0 0 0 30px white inset !important;
            -webkit-text-fill-color: #1e293b !important;
            transition: background-color 5000s ease-in-out 0s;
        }
      `}} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row relative">
        
        {/* Left Panel - Information */}
        <div className="hidden lg:flex flex-col w-[50%] relative overflow-hidden bg-white">
          {/* Background Image Illustration */}
          <div className="absolute right-0 bottom-0 w-[120%] h-[120%] z-0 pointer-events-none opacity-[0.22] transition-transform duration-[10s] hover:scale-105 ease-out origin-bottom-right">
            <Image 
              src="/courthouse-bg.png" 
              alt="Courthouse Illustration" 
              fill 
              className="object-cover object-bottom"
              priority
            />
          </div>

          {/* Smooth Gradients */}
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-transparent z-0 pointer-events-none"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#EEF4FF]/70 via-transparent to-white/40 z-0 pointer-events-none"></div>

          {/* Soft floating orbs */}
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-[100px] opacity-60 animate-pulse" style={{ animationDuration: '8s' }}></div>
          <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-indigo-50 rounded-full mix-blend-multiply filter blur-[80px] opacity-70 animate-pulse" style={{ animationDuration: '12s' }}></div>

          {/* Content */}
          <div className="relative z-10 flex flex-col h-full pl-16 pr-8 pt-12 pb-16">
            
            {/* Logo Top Left */}
            <div className="mb-16 transform transition-transform hover:scale-105 duration-300 origin-left">
              <div className="relative w-[180px] h-[50px]">
                <Image src="/logo.png" alt="Logo" fill className="object-contain object-left" />
              </div>
            </div>

            <div className="max-w-[480px]">
              <h2 className={`${playfair.className} text-[48px] text-[#0f172a] mb-2 leading-[1.1] font-semibold tracking-tight`}>
                Rahimullah <br/><span className="text-[#0d6efd] bg-clip-text text-transparent bg-gradient-to-r from-[#0d6efd] to-[#4f46e5]">Advocate</span>
              </h2>
              <h3 className="text-[18px] text-[#475569] mb-8 font-medium tracking-wide uppercase letter-spacing-[0.1em]">
                Legal Practice Management System
              </h3>
              
              <div className="h-1 w-20 bg-gradient-to-r from-[#d4af37] to-[#f9d976] rounded-full mb-8 shadow-[0_2px_10px_rgba(212,175,55,0.4)]"></div>
              
              <p className="text-[#64748b] mb-12 text-[16px] leading-relaxed pr-4 font-light">
                A complete, state-of-the-art solution to manage your cases, hearings, clients, documents, and finances securely and efficiently.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-5 group cursor-default">
                  <div className="p-3.5 bg-white rounded-2xl text-[#0d6efd] shadow-[0_4px_20px_rgba(13,110,253,0.08)] border border-blue-50 transition-all duration-300 group-hover:shadow-[0_8px_30px_rgba(13,110,253,0.15)] group-hover:-translate-y-1 group-hover:bg-[#f8faff]">
                    <Briefcase strokeWidth={1.5} size={22} className="transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  <div className="pt-1.5">
                    <h4 className="font-semibold text-slate-800 text-[15px] group-hover:text-[#0d6efd] transition-colors">Case Management</h4>
                    <p className="text-[14px] text-slate-500 mt-1">Organize and track all your cases in one place.</p>
                  </div>
                </div>

                <div className="flex items-start gap-5 group cursor-default">
                  <div className="p-3.5 bg-white rounded-2xl text-[#0d6efd] shadow-[0_4px_20px_rgba(13,110,253,0.08)] border border-blue-50 transition-all duration-300 group-hover:shadow-[0_8px_30px_rgba(13,110,253,0.15)] group-hover:-translate-y-1 group-hover:bg-[#f8faff]">
                    <Calendar strokeWidth={1.5} size={22} className="transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  <div className="pt-1.5">
                    <h4 className="font-semibold text-slate-800 text-[15px] group-hover:text-[#0d6efd] transition-colors">Hearing Scheduler</h4>
                    <p className="text-[14px] text-slate-500 mt-1">Never miss a hearing with smart reminders.</p>
                  </div>
                </div>

                <div className="flex items-start gap-5 group cursor-default">
                  <div className="p-3.5 bg-white rounded-2xl text-[#0d6efd] shadow-[0_4px_20px_rgba(13,110,253,0.08)] border border-blue-50 transition-all duration-300 group-hover:shadow-[0_8px_30px_rgba(13,110,253,0.15)] group-hover:-translate-y-1 group-hover:bg-[#f8faff]">
                    <FileText strokeWidth={1.5} size={22} className="transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  <div className="pt-1.5">
                    <h4 className="font-semibold text-slate-800 text-[15px] group-hover:text-[#0d6efd] transition-colors">Secure Documents</h4>
                    <p className="text-[14px] text-slate-500 mt-1">Store and access documents securely.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Login */}
        <div className="flex-1 flex flex-col justify-center items-center bg-[#F8FAFC] p-6 py-12 relative overflow-hidden">
          
          {/* Subtle Right Background Orbs */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-blue-100/40 to-transparent rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-50/60 to-transparent rounded-full blur-[100px] pointer-events-none translate-y-1/3 -translate-x-1/4"></div>

          <div className="w-full max-w-[480px] bg-white/90 backdrop-blur-xl rounded-[28px] shadow-[0_20px_60px_-15px_rgba(15,23,42,0.08)] px-10 py-12 border border-white/60 relative z-10 transition-transform hover:shadow-[0_25px_70px_-15px_rgba(13,110,253,0.12)] duration-500">
            
            <div className="flex flex-col items-center mb-10">
              <div className="relative w-[180px] h-[70px] mb-8 group">
                <Image src="/logo.png" alt="Logo" fill className="object-contain transition-transform duration-500 group-hover:scale-105" />
              </div>
              <h2 className="text-[30px] font-bold text-[#0f172a] mb-2 tracking-tight">Welcome Back</h2>
              <p className="text-[15px] text-[#64748b] text-center font-light">
                Sign in to continue to your secure workspace
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleLogin}>
              
              {error && (
                <div className="bg-red-50/80 backdrop-blur-sm border border-red-100 text-red-600 text-sm p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                     <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  </div>
                  <span className="font-medium">{error}</span>
                </div>
              )}

              <div className="space-y-2.5">
                <label className="block text-[14px] font-semibold text-slate-700 ml-1">Username</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-300 group-focus-within:text-[#0d6efd]">
                    <User className="h-[18px] w-[18px] text-slate-400 group-focus-within:text-[#0d6efd] transition-colors" strokeWidth={2} />
                  </div>
                  <input
                    type="text"
                    required
                    suppressHydrationWarning
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full pl-12 pr-4 py-4 border border-slate-200 rounded-2xl text-[15px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#0d6efd]/15 focus:border-[#0d6efd] transition-all bg-slate-50 hover:bg-slate-50/50 focus:bg-white shadow-[0_2px_10px_rgba(0,0,0,0.01)]"
                    placeholder="Enter your username"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="block text-[14px] font-semibold text-slate-700 ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-300 group-focus-within:text-[#0d6efd]">
                    <Lock className="h-[18px] w-[18px] text-slate-400 group-focus-within:text-[#0d6efd] transition-colors" strokeWidth={2} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    suppressHydrationWarning
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-12 pr-12 py-4 border border-slate-200 rounded-2xl text-[15px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#0d6efd]/15 focus:border-[#0d6efd] transition-all bg-slate-50 hover:bg-slate-50/50 focus:bg-white shadow-[0_2px_10px_rgba(0,0,0,0.01)]"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-2 px-3 flex items-center text-slate-400 hover:text-[#0d6efd] hover:bg-blue-50 transition-colors rounded-xl my-2"
                  >
                    {showPassword ? <EyeOff className="h-[18px] w-[18px]" strokeWidth={2} /> : <Eye className="h-[18px] w-[18px]" strokeWidth={2} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 pb-4">
                <div className="flex items-center group">
                  <div className="relative flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="peer h-5 w-5 text-[#0d6efd] focus:ring-[#0d6efd] focus:ring-offset-1 border-slate-300 rounded-md cursor-pointer transition-colors"
                    />
                  </div>
                  <label htmlFor="remember-me" className="ml-3 block text-[14px] font-medium text-slate-600 cursor-pointer group-hover:text-slate-800 transition-colors">
                    Remember me
                  </label>
                </div>

                <div className="text-[14px]">
                  <a href="#" className="font-semibold text-[#0d6efd] hover:text-[#0b5ed7] transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:w-full after:bg-[#0d6efd] after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:origin-right hover:after:origin-left">
                    Forgot password?
                  </a>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  suppressHydrationWarning
                  className="group w-full flex items-center justify-center gap-2 py-4 px-4 rounded-2xl text-[16px] font-bold text-white bg-gradient-to-r from-[#0d6efd] to-[#2563eb] hover:from-[#0b5ed7] hover:to-[#1d4ed8] focus:outline-none focus:ring-4 focus:ring-[#0d6efd]/30 transition-all duration-300 shadow-[0_8px_20px_-6px_rgba(13,110,253,0.5)] hover:shadow-[0_12px_25px_-8px_rgba(13,110,253,0.6)] hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 w-[150%] h-[150%] -skew-x-12 -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out"></div>
                  {isLoading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Lock size={18} strokeWidth={2.5} />
                      Sign In
                      <ArrowRight size={18} strokeWidth={2.5} className="ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 absolute right-6" />
                    </>
                  )}
                </button>
              </div>
              
              <div className="mt-10 relative pt-6 text-center">
                <div className="absolute inset-0 flex items-center pt-6">
                  <div className="w-full border-t border-slate-100"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-[#0d6efd] bg-blue-50/50 rounded-full py-1.5 ring-[12px] ring-white shadow-sm border border-blue-100 flex items-center gap-2">
                    <Shield size={14} strokeWidth={2.5} />
                    <span className="font-semibold text-[12px] tracking-wide uppercase text-blue-700">SSL Secured</span>
                  </span>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      {/* Footer across entire bottom */}
      <footer className="w-full bg-white border-t border-slate-200 py-5 px-8 flex flex-col sm:flex-row items-center justify-between text-[13px] text-slate-500 z-50">
        <div className="font-medium text-slate-600">&copy; {new Date().getFullYear()} Rahimullah Advocate Associates. All rights reserved.</div>
        <div className="hidden sm:flex items-center gap-2 text-slate-400">
           <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> System Online &nbsp;|&nbsp; Version 1.0.0
        </div>
        <div className="flex items-center gap-2">
          Powered by <span className="font-bold text-[#0f172a] tracking-tight">EagleNest<span className="text-[#0d6efd]">Creations</span></span>
        </div>
      </footer>
    </div>
  );
}
