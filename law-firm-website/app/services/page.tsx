import Image from "next/image";
import Link from "next/link";
import { Scale, Briefcase, Shield, Users, ArrowRight, CheckCircle2 } from "lucide-react";

export default function ServicesPage() {
  return (
    <div className="w-full bg-alabaster min-h-screen">
      {/* HEADER SECTION */}
      <section className="relative text-white py-32 px-8 flex items-center justify-center min-h-[50vh] overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image 
            src="/images/services-hero.png" 
            alt="Courthouse Facade" 
            fill 
            className="object-cover object-center"
            priority
          />
          {/* Rich Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/80 to-transparent z-0"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 bg-gold/20 border border-gold/50 px-4 py-1.5 text-gold text-xs font-bold tracking-widest uppercase mb-6 backdrop-blur-sm rounded-full">
            Practice Areas
          </div>
          <h1 className="font-serif text-5xl md:text-6xl font-bold mb-6 drop-shadow-lg leading-tight">
            Comprehensive Legal <span className="text-gold">Mastery.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
            Delivering precise, authoritative, and strategic legal counsel. Our practice concentrates on the areas of law essential to protecting assets, liberties, and business enterprises.
          </p>
        </div>
      </section>

      {/* SERVICES CONTENT */}
      <section className="py-24 px-8 relative z-20 -mt-16">
        <div className="max-w-5xl mx-auto space-y-12">
          
          {/* Civil Litigation */}
          <div className="group bg-white border border-slate-200 p-8 md:p-14 shadow-lg hover:shadow-2xl transition-all duration-500 relative overflow-hidden rounded-sm hover:-translate-y-1">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-navy group-hover:bg-gold transition-colors duration-500"></div>
            
            {/* Watermark Icon */}
            <Scale className="absolute -right-10 -bottom-10 text-slate-50 opacity-50 transform rotate-12 group-hover:scale-110 transition-transform duration-700" size={300} />

            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
              <div className="bg-slate-50 p-6 rounded-sm border border-slate-100 flex-shrink-0 group-hover:border-gold/30 group-hover:bg-gold/5 transition-colors duration-300">
                <Scale className="text-navy group-hover:text-gold transition-colors duration-300" size={48} />
              </div>
              <div className="flex-1">
                <h2 className="font-serif text-3xl md:text-4xl font-bold text-navy mb-4 group-hover:text-gold transition-colors duration-300">Civil Litigation</h2>
                <div className="h-0.5 w-16 bg-gold mb-6 group-hover:w-32 transition-all duration-500"></div>
                <p className="text-slate-600 leading-relaxed text-lg mb-6">
                  Resolving complex property, contractual, and civil disputes through thorough evidentiary analysis and court representation. We prepare every matter with the rigorous diligence required for trial, drafting precise legal arguments designed to secure favorable settlements or successful outcomes in court.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                  <div className="flex items-center gap-2 text-sm text-slate-700 font-medium"><CheckCircle2 size={16} className="text-gold" /> Property Disputes</div>
                  <div className="flex items-center gap-2 text-sm text-slate-700 font-medium"><CheckCircle2 size={16} className="text-gold" /> Breach of Contract</div>
                  <div className="flex items-center gap-2 text-sm text-slate-700 font-medium"><CheckCircle2 size={16} className="text-gold" /> Torts & Personal Injury</div>
                  <div className="flex items-center gap-2 text-sm text-slate-700 font-medium"><CheckCircle2 size={16} className="text-gold" /> Appellate Practice</div>
                </div>
                <Link href="/book-consultation" className="inline-flex items-center gap-2 bg-navy text-white hover:bg-gold px-6 py-3 font-bold text-sm tracking-wide transition-colors duration-300 rounded-sm">
                  Retain Civil Counsel <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>

          {/* Corporate Law */}
          <div className="group bg-white border border-slate-200 p-8 md:p-14 shadow-lg hover:shadow-2xl transition-all duration-500 relative overflow-hidden rounded-sm hover:-translate-y-1">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-navy group-hover:bg-gold transition-colors duration-500"></div>
            
            {/* Watermark Icon */}
            <Briefcase className="absolute -right-10 -bottom-10 text-slate-50 opacity-50 transform rotate-12 group-hover:scale-110 transition-transform duration-700" size={300} />

            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
              <div className="bg-slate-50 p-6 rounded-sm border border-slate-100 flex-shrink-0 group-hover:border-gold/30 group-hover:bg-gold/5 transition-colors duration-300">
                <Briefcase className="text-navy group-hover:text-gold transition-colors duration-300" size={48} />
              </div>
              <div className="flex-1">
                <h2 className="font-serif text-3xl md:text-4xl font-bold text-navy mb-4 group-hover:text-gold transition-colors duration-300">Corporate Law</h2>
                <div className="h-0.5 w-16 bg-gold mb-6 group-hover:w-32 transition-all duration-500"></div>
                <p className="text-slate-600 leading-relaxed text-lg mb-6">
                  Structuring corporate entities, drafting precise commercial agreements, and representing businesses to protect enterprise value. We act as external general counsel to leading local enterprises, mitigating legal and compliance risks to safeguard operations.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                  <div className="flex items-center gap-2 text-sm text-slate-700 font-medium"><CheckCircle2 size={16} className="text-gold" /> Entity Formation</div>
                  <div className="flex items-center gap-2 text-sm text-slate-700 font-medium"><CheckCircle2 size={16} className="text-gold" /> Mergers & Acquisitions</div>
                  <div className="flex items-center gap-2 text-sm text-slate-700 font-medium"><CheckCircle2 size={16} className="text-gold" /> Employment Law</div>
                  <div className="flex items-center gap-2 text-sm text-slate-700 font-medium"><CheckCircle2 size={16} className="text-gold" /> Intellectual Property</div>
                </div>
                <Link href="/book-consultation" className="inline-flex items-center gap-2 bg-navy text-white hover:bg-gold px-6 py-3 font-bold text-sm tracking-wide transition-colors duration-300 rounded-sm">
                  Retain Corporate Counsel <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>

          {/* Criminal Defense */}
          <div className="group bg-white border border-slate-200 p-8 md:p-14 shadow-lg hover:shadow-2xl transition-all duration-500 relative overflow-hidden rounded-sm hover:-translate-y-1">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-navy group-hover:bg-rose-600 transition-colors duration-500"></div>
            
            {/* Watermark Icon */}
            <Shield className="absolute -right-10 -bottom-10 text-slate-50 opacity-50 transform rotate-12 group-hover:scale-110 transition-transform duration-700" size={300} />

            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
              <div className="bg-slate-50 p-6 rounded-sm border border-slate-100 flex-shrink-0 group-hover:border-rose-200 group-hover:bg-rose-50 transition-colors duration-300">
                <Shield className="text-navy group-hover:text-rose-600 transition-colors duration-300" size={48} />
              </div>
              <div className="flex-1">
                <h2 className="font-serif text-3xl md:text-4xl font-bold text-navy mb-4 group-hover:text-rose-600 transition-colors duration-300">Criminal Defense</h2>
                <div className="h-0.5 w-16 bg-gold mb-6 group-hover:bg-rose-600 group-hover:w-32 transition-all duration-500"></div>
                <p className="text-slate-600 leading-relaxed text-lg mb-6">
                  Providing rigorous, strategic representation to safeguard constitutional rights and legal protections at all stages of the judicial process. From corporate white-collar investigations to felony defense, we challenge prosecution cases through detailed cross-examination and strict procedural compliance.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                  <div className="flex items-center gap-2 text-sm text-slate-700 font-medium"><CheckCircle2 size={16} className="text-rose-600" /> White-Collar Crime</div>
                  <div className="flex items-center gap-2 text-sm text-slate-700 font-medium"><CheckCircle2 size={16} className="text-rose-600" /> Felony Defense</div>
                  <div className="flex items-center gap-2 text-sm text-slate-700 font-medium"><CheckCircle2 size={16} className="text-rose-600" /> Bail & Pre-trial Release</div>
                  <div className="flex items-center gap-2 text-sm text-slate-700 font-medium"><CheckCircle2 size={16} className="text-rose-600" /> Federal Investigations</div>
                </div>
                <Link href="/book-consultation" className="inline-flex items-center gap-2 bg-navy text-white hover:bg-rose-600 px-6 py-3 font-bold text-sm tracking-wide transition-colors duration-300 rounded-sm">
                  Retain Criminal Defense Counsel <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>

          {/* Family Law */}
          <div className="group bg-white border border-slate-200 p-8 md:p-14 shadow-lg hover:shadow-2xl transition-all duration-500 relative overflow-hidden rounded-sm hover:-translate-y-1">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-navy group-hover:bg-gold transition-colors duration-500"></div>
            
            {/* Watermark Icon */}
            <Users className="absolute -right-10 -bottom-10 text-slate-50 opacity-50 transform rotate-12 group-hover:scale-110 transition-transform duration-700" size={300} />

            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
              <div className="bg-slate-50 p-6 rounded-sm border border-slate-100 flex-shrink-0 group-hover:border-gold/30 group-hover:bg-gold/5 transition-colors duration-300">
                <Users className="text-navy group-hover:text-gold transition-colors duration-300" size={48} />
              </div>
              <div className="flex-1">
                <h2 className="font-serif text-3xl md:text-4xl font-bold text-navy mb-4 group-hover:text-gold transition-colors duration-300">Family Law</h2>
                <div className="h-0.5 w-16 bg-gold mb-6 group-hover:w-32 transition-all duration-500"></div>
                <p className="text-slate-600 leading-relaxed text-lg mb-6">
                  Advising on family law matters, including marital dissolutions, child custody, and estate succession, with absolute discretion. We balance firm advocacy in judicial proceedings with professional negotiation to protect familial interests and estate assets.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                  <div className="flex items-center gap-2 text-sm text-slate-700 font-medium"><CheckCircle2 size={16} className="text-gold" /> High-Net-Worth Divorce</div>
                  <div className="flex items-center gap-2 text-sm text-slate-700 font-medium"><CheckCircle2 size={16} className="text-gold" /> Child Custody</div>
                  <div className="flex items-center gap-2 text-sm text-slate-700 font-medium"><CheckCircle2 size={16} className="text-gold" /> Estate & Inheritance</div>
                  <div className="flex items-center gap-2 text-sm text-slate-700 font-medium"><CheckCircle2 size={16} className="text-gold" /> Pre-nuptial Agreements</div>
                </div>
                <Link href="/book-consultation" className="inline-flex items-center gap-2 bg-navy text-white hover:bg-gold px-6 py-3 font-bold text-sm tracking-wide transition-colors duration-300 rounded-sm">
                  Retain Family Counsel <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
