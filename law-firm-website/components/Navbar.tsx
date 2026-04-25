'use client';

import Link from 'next/link';
import { Lock, Menu, X, Scale } from 'lucide-react';
import { useState } from 'react';

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Scale className="text-[#B4935E]" size={28} />
          <span className="font-serif font-bold text-xl tracking-tight text-slate-50 uppercase">
            EagleNest Legal Solutions <span className="text-[#B4935E]"></span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <Link href="/practice-areas" className="hover:text-[#B4935E] transition-colors duration-200">Practice Areas</Link>
          <Link href="/our-firm" className="hover:text-[#B4935E] transition-colors duration-200">Our Firm</Link>
          <Link href="/contact" className="hover:text-[#B4935E] transition-colors duration-200">Contact</Link>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/login"
            className="flex items-center gap-2 border border-slate-700 hover:border-[#B4935E] text-slate-300 hover:text-[#B4935E] text-sm font-semibold px-4 py-2.5 transition-all duration-200"
          >
            <Lock size={16} />
            Client Portal Login
          </Link>
          <Link
            href="/contact"
            className="bg-[#B4935E] hover:bg-[#8F7040] text-slate-900 text-sm font-bold px-6 py-2.5 shadow-sm transition-colors duration-200 uppercase tracking-wide"
          >
            Book Consultation
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden p-2 text-slate-300"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-slate-900 border-t border-slate-800 px-6 py-6 space-y-4 text-sm font-medium text-slate-300">
          <Link href="/practice-areas" className="block hover:text-[#B4935E] transition-colors" onClick={() => setMobileOpen(false)}>Practice Areas</Link>
          <Link href="/our-firm" className="block hover:text-[#B4935E] transition-colors" onClick={() => setMobileOpen(false)}>Our Firm</Link>
          <Link href="/contact" className="block hover:text-[#B4935E] transition-colors" onClick={() => setMobileOpen(false)}>Contact</Link>
          <div className="pt-4 flex flex-col gap-3">
            <Link href="/login" className="flex items-center justify-center gap-2 border border-slate-700 text-slate-300 py-3 transition-colors hover:border-[#B4935E] hover:text-[#B4935E]" onClick={() => setMobileOpen(false)}>
              <Lock size={16} /> Client Portal Login
            </Link>
            <Link href="/contact" className="bg-[#B4935E] text-slate-900 text-center font-bold py-3 uppercase tracking-wide hover:bg-[#8F7040] transition-colors" onClick={() => setMobileOpen(false)}>
              Book Consultation
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
