import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Lock } from "lucide-react";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ["latin"], variable: '--font-playfair' });

export const metadata: Metadata = {
  title: "EagleNest Legal Solutions  | Expert Legal Solutions in Swat",
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
        <nav className="bg-navy text-white py-6 px-8 shadow-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <Link href="/" className="font-serif text-2xl font-bold tracking-wide text-white hover:text-gold transition-colors duration-200">
              EagleNest Legal Solutions 
            </Link>
            <div className="hidden md:flex space-x-8 items-center font-medium">
              <Link href="/" className="hover:text-gold transition-colors duration-200">Home</Link>
              <Link href="/services" className="hover:text-gold transition-colors duration-200">Our Services</Link>
              <Link href="/book-consultation" className="hover:text-gold transition-colors duration-200">Book Consultation</Link>
              
              <a href={process.env.NEXT_PUBLIC_PORTAL_URL || "https://clientcounsel.vercel.app"} className="flex items-center space-x-2 px-4 py-2 border border-slate-500 rounded-sm hover:border-white transition-colors duration-200 text-sm">
                <Lock size={16} />
                <span>Client Portal Login</span>
              </a>
              <Link href="/book-consultation" className="bg-gold hover:bg-goldHover text-white px-6 py-2 rounded-sm transition-colors duration-200 text-sm">
                Book Consultation
              </Link>
            </div>
          </div>
        </nav>

        {/* PAGE CONTENT */}
        <main className="flex-grow">
          {children}
        </main>

        {/* GLOBAL FOOTER */}
        <footer className="bg-navy text-slate-300 py-12 px-8 mt-20">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-serif text-xl font-bold text-white mb-4">EagleNest Legal Solutions </h3>
              <p className="text-sm leading-relaxed">Expert legal solutions and unyielding advocacy for the people and businesses of Swat, KPK.</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4 uppercase tracking-wider text-sm">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><a href={process.env.NEXT_PUBLIC_PORTAL_URL || "https://clientcounsel.vercel.app"} className="hover:text-gold transition-colors duration-200">Client Portal Login</a></li>
                <li><Link href="/services" className="hover:text-gold transition-colors duration-200">Our Services</Link></li>
                <li><Link href="/book-consultation" className="hover:text-gold transition-colors duration-200">Book Consultation</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4 uppercase tracking-wider text-sm">Office</h4>
              <p className="text-sm">Mingora, Swat<br />Khyber Pakhtunkhwa, Pakistan</p>
              <p className="text-sm mt-2 font-bold text-gold">Emergency: (123) 456-7890</p>
            </div>
          </div>
          <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-700 text-xs text-center">
            &copy; {new Date().getFullYear()} EagleNest Legal Solutions . All rights reserved. Strictly confidential.
          </div>
        </footer>

      </body>
    </html>
  );
}