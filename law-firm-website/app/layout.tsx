import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import "./globals.css";
import Link from "next/link";
import { Lock, MapPin, Phone, Mail, Clock, MessageCircle, ChevronUp } from "lucide-react";
import Image from "next/image";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ["latin"], variable: '--font-playfair' });

export const metadata: Metadata = {
  title: "Rahimullah Advocate | Expert Legal Services in Swat",
  description: "Relentless representation and strategic counsel for businesses and individuals in Khyber Pakhtunkhwa.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} font-sans bg-alabaster text-slate-800 antialiased flex flex-col min-h-screen`}>


        {/* GLOBAL NAVIGATION */}
        <Navbar />

        {/* PAGE CONTENT */}
        <main className="flex-grow">
          {children}
        </main>

        {/* GLOBAL FOOTER */}
        <footer className="bg-white py-16 px-8 border-t border-slate-100">
          <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
            {/* Column 1: Brand & Details */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="relative w-12 h-12 flex-shrink-0">
                  <Image src="/logo.png" alt="Rahimullah Advocate Logo" fill className="object-contain" sizes="48px" />
                </div>
                <div className="flex flex-col">
                  <span className="font-serif text-xl font-bold leading-tight text-navy">RAHIMULLAH</span>
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-medium">Advocate Law Chamber Swat</span>
                </div>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed mb-6 max-w-sm">
                Providing reliable legal solutions with integrity, professionalism and a deep commitment to justice.
              </p>
              <div className="flex items-center gap-4 text-gold">
                <a href="#" className="hover:text-navy transition-colors">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                </a>
                <a href="#" className="hover:text-navy transition-colors">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                </a>
                <a href="#" className="hover:text-navy transition-colors">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                </a>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h4 className="font-bold text-navy mb-6 text-sm">QUICK LINKS</h4>
              <ul className="space-y-3 text-sm text-slate-600 font-medium">
                <li><Link href="/" className="hover:text-gold transition-colors">Home</Link></li>
                <li><Link href="/about" className="hover:text-gold transition-colors">About Us</Link></li>
                <li><Link href="/services" className="hover:text-gold transition-colors">Practice Areas</Link></li>
                <li><Link href="/reviews" className="hover:text-gold transition-colors text-sm">Client Reviews</Link></li>
                <li><Link href="/hearings" className="hover:text-gold transition-colors">Hearings</Link></li>
                <li><Link href="/contact" className="hover:text-gold transition-colors">Contact Us</Link></li>
              </ul>
            </div>

            {/* Column 3: Practice Areas */}
            <div>
              <h4 className="font-bold text-navy mb-6 text-sm">PRACTICE AREAS</h4>
              <ul className="space-y-3 text-sm text-slate-600 font-medium">
                <li><Link href="/services#civil" className="hover:text-gold transition-colors">Civil Litigation</Link></li>
                <li><Link href="/services#family" className="hover:text-gold transition-colors">Family Law</Link></li>
                <li><Link href="/services#criminal" className="hover:text-gold transition-colors">Criminal Defense</Link></li>
                <li><Link href="/services#corporate" className="hover:text-gold transition-colors">Corporate Law</Link></li>
                <li><Link href="/services#property" className="hover:text-gold transition-colors">Property Law</Link></li>
                <li><Link href="/services#taxation" className="hover:text-gold transition-colors">Taxation</Link></li>
              </ul>
            </div>

            {/* Column 4: Courts & Contact */}
            <div className="lg:col-span-1">
              <div className="mb-8">
                <h4 className="font-bold text-navy mb-6 text-sm">COURTS WE PRACTICE IN</h4>
                <ul className="space-y-3 text-sm text-slate-600 font-medium">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-gold mt-1.5 flex-shrink-0"></div>
                    <span>High Court Darul Qaza Swat</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-gold mt-1.5 flex-shrink-0"></div>
                    <span>District Courts GulKada Swat</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-gold mt-1.5 flex-shrink-0"></div>
                    <span>Judicial Complex Kabal Swat</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="lg:col-span-1">
              <h4 className="font-bold text-navy mb-6 text-sm">CONTACT INFO</h4>
              <ul className="space-y-4 text-sm text-slate-600">
                <li className="flex items-start gap-3">
                  <MapPin size={16} className="text-gold mt-1 flex-shrink-0" />
                  <span>Opposite Tehsil Courts 1st Floor,<br />Hassan Trade Center Kabal, Swat</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone size={16} className="text-gold flex-shrink-0" />
                  <span>0345-9309670</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail size={16} className="text-gold flex-shrink-0" />
                  <span>rahimullahadvocate@gmail.com</span>
                </li>
                <li className="flex items-center gap-3">
                  <Clock size={16} className="text-gold flex-shrink-0" />
                  <span>Mon - Sat: 10:00 AM - 07:00 PM</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="max-w-[1600px] mx-auto mt-16 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 relative">
            <p className="text-xs text-slate-500 font-medium text-center md:text-left">
              &copy; {new Date().getFullYear()} Rahimullah Advocate Law Chamber Swat. All Rights Reserved.
            </p>
            <button className="absolute right-0 -top-12 bg-gold hover:bg-goldHover text-white p-3 rounded-sm shadow-md transition-colors transform -translate-y-1/2">
              <ChevronUp size={20} />
            </button>
          </div>
        </footer>

      </body>
    </html>
  );
}