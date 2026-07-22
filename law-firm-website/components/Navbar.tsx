"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Lock } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/' && pathname !== '/') return false;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return pathname === path;
  };

  const getLinkClass = (path: string) => {
    const baseClass = "transition-colors duration-200 uppercase";
    if (isActive(path)) {
      return `${baseClass} text-gold border-b-2 border-gold pb-1`;
    }
    return `${baseClass} hover:text-gold pb-1 border-b-2 border-transparent`;
  };

  return (
    <nav className="bg-white py-4 px-8 sticky top-0 z-50 shadow-sm border-b border-slate-100">
      <div className="max-w-[1600px] mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative w-12 h-12 flex-shrink-0">
            <Image src="/logo.png" alt="Rahimullah Advocate Logo" fill className="object-contain" sizes="48px" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-xl font-bold leading-tight text-navy">RAHIMULLAH</span>
            <span className="text-[9px] uppercase tracking-wider text-slate-500 font-medium">Advocate Law Chamber Swat</span>
          </div>
        </Link>

        <div className="hidden lg:flex space-x-8 items-center font-bold text-sm tracking-wide text-navy">
          <Link href="/" className={getLinkClass("/")}>Home</Link>
          <Link href="/about" className={getLinkClass("/about")}>About Us</Link>
          <Link href="/services" className={getLinkClass("/services")}>Practice Areas</Link>
          <Link href="/reviews" className={getLinkClass("/reviews")}>Client Reviews</Link>
          <Link href="/hearings" className={getLinkClass("/hearings")}>Hearings</Link>
          <Link href="/contact" className={getLinkClass("/contact")}>Contact</Link>

          <a href={process.env.NEXT_PUBLIC_PORTAL_URL || "https://clientcounsel.vercel.app"} className="flex items-center space-x-2 px-6 py-2.5 bg-gold hover:bg-goldHover text-white rounded-sm transition-colors duration-200 text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 ml-4">
            <Lock size={14} />
            <span className="uppercase">Client Portal &rarr;</span>
          </a>
        </div>

        {/* Mobile menu button */}
        <div className="lg:hidden flex items-center">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-navy p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-100 shadow-md py-4 px-8 flex flex-col gap-4 font-bold text-sm tracking-wide text-navy">
          <Link href="/" onClick={() => setMobileMenuOpen(false)} className={getLinkClass("/")}>Home</Link>
          <Link href="/about" onClick={() => setMobileMenuOpen(false)} className={getLinkClass("/about")}>About Us</Link>
          <Link href="/services" onClick={() => setMobileMenuOpen(false)} className={getLinkClass("/services")}>Practice Areas</Link>
          <Link href="/reviews" onClick={() => setMobileMenuOpen(false)} className={getLinkClass("/reviews")}>Client Reviews</Link>
          <Link href="/hearings" onClick={() => setMobileMenuOpen(false)} className={getLinkClass("/hearings")}>Hearings</Link>
          <Link href="/contact" onClick={() => setMobileMenuOpen(false)} className={getLinkClass("/contact")}>Contact</Link>
        </div>
      )}
    </nav>
  );
}
