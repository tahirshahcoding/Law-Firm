import HearingsDashboard from '@/components/HearingsDashboard';
import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Hearings & Cause List - Rahimullah Advocate',
  description: 'View upcoming hearings, daily cause lists, and track your case status.',
};

export default function HearingsPage() {
  return (
    <div className="bg-[#f8f9fa] min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-navy text-white pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image 
            src="/hero-bg.jpg" 
            alt="Courthouse pillars" 
            fill
            className="object-cover opacity-20"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/90 to-transparent"></div>
        </div>
        
        <div className="max-w-[1600px] mx-auto px-8 relative z-10">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-gold mb-4 text-sm font-bold tracking-widest uppercase">
              <span className="w-8 h-[2px] bg-gold"></span>
              Hearings
            </div>
            <h1 className="text-5xl md:text-6xl font-serif font-bold mb-4 leading-tight">
              Stay Informed.<br/>
              <span className="text-gold">Never Miss a Hearing.</span>
            </h1>
            <p className="text-slate-300 text-lg mb-8 max-w-xl">
              View all your scheduled hearings, track updates, and get timely reminders – all in one place.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <a href="#dashboard" className="px-8 py-3 bg-gold hover:bg-goldHover text-white rounded-sm font-semibold tracking-wide transition-colors uppercase text-sm">
                Track Your Case &rarr;
              </a>
              <a href={process.env.NEXT_PUBLIC_PORTAL_URL || "#"} className="px-8 py-3 bg-transparent border border-white hover:bg-white/10 text-white rounded-sm font-semibold tracking-wide transition-colors uppercase text-sm">
                Client Portal &rarr;
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section id="dashboard" className="py-16 px-8">
        <div className="max-w-[1600px] mx-auto">
          <HearingsDashboard />
        </div>
      </section>

      {/* Features Bottom */}
      <section className="bg-white py-16 px-8 border-t border-slate-100">
        <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex items-start gap-4">
             <div className="w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center shrink-0">
               <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
             </div>
             <div>
               <h3 className="font-bold text-navy mb-1">Timely Notifications</h3>
               <p className="text-sm text-slate-500">Get instant alerts and reminders for all hearings.</p>
             </div>
          </div>
          <div className="flex items-start gap-4">
             <div className="w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center shrink-0">
               <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
             </div>
             <div>
               <h3 className="font-bold text-navy mb-1">Case Updates</h3>
               <p className="text-sm text-slate-500">Stay updated with the latest hearing status and orders.</p>
             </div>
          </div>
          <div className="flex items-start gap-4">
             <div className="w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center shrink-0">
               <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
             </div>
             <div>
               <h3 className="font-bold text-navy mb-1">Easy Management</h3>
               <p className="text-sm text-slate-500">View, filter and manage all your hearings in one place.</p>
             </div>
          </div>
          <div className="flex items-start gap-4">
             <div className="w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center shrink-0">
               <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
             </div>
             <div>
               <h3 className="font-bold text-navy mb-1">Secure & Confidential</h3>
               <p className="text-sm text-slate-500">Your case and hearing details are always protected.</p>
             </div>
          </div>
        </div>
      </section>
    </div>
  );
}
