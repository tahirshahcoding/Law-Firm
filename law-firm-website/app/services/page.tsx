import Image from "next/image";
import Link from "next/link";
import { ScrollReveal, RevealItem } from "../../components/ScrollReveal";
import { Scale, Users, Gavel, Building, Home, FileText, UsersRound, ShieldCheck, ArrowRight, Phone } from "lucide-react";

export const metadata = {
  title: "Practice Areas | Rahimullah Advocate Law Chamber Swat",
  description: "Comprehensive legal solutions for every aspect of life and business.",
};

export default function ServicesPage() {
  return (
    <div className="flex flex-col min-h-screen">

      {/* 1. HERO SECTION */}
      <section className="relative w-full h-[50vh] min-h-[450px] flex items-center overflow-hidden bg-navy">
        <Image
          src="/images/hero-bg.png"
          alt="Courthouse Pillars"
          fill
          className="object-cover object-center opacity-70 mix-blend-overlay"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent"></div>

        <div className="relative z-10 max-w-[1600px] mx-auto w-full px-8">
          <ScrollReveal>
            <div className="max-w-3xl flex flex-col items-start text-left">
              <span className="text-gold font-bold tracking-widest uppercase text-sm mb-4">Our Practice Areas</span>
              <h1 className="text-5xl md:text-6xl font-serif text-navy mb-6 tracking-tight leading-tight">
                Comprehensive Legal<br />
                Solutions for Every<br />
                Aspect of <span className="text-gold italic font-medium">Life & Business.</span>
              </h1>
              <div className="w-16 h-1 bg-gold mb-8"></div>
              <p className="text-slate-600 text-lg leading-relaxed max-w-xl">
                We provide expert legal services across a wide range of practice areas. Our focus is on delivering practical, effective, and results-driven solutions tailored to your unique situation.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 2. PRACTICE AREAS GRID SECTION */}
      <section className="py-24 px-8 bg-alabaster">
        <div className="max-w-[1600px] mx-auto">

          <ScrollReveal staggerChildren>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

              {/* Card 1: Civil Litigation */}
              <RevealItem>
                <div className="bg-white border border-slate-100 p-10 flex flex-col items-center text-center transition-transform hover:-translate-y-2 hover:shadow-xl duration-500 rounded-sm h-full group">
                  <div className="w-20 h-20 rounded-full border border-gold flex items-center justify-center mb-6 bg-white group-hover:bg-gold/5 transition-colors">
                    <Scale className="text-gold w-8 h-8" strokeWidth={1} />
                  </div>
                  <h3 className="font-serif font-bold text-navy text-2xl mb-4">Civil Litigation</h3>
                  <div className="w-8 h-[2px] bg-gold mb-6 opacity-50"></div>
                  <p className="text-slate-600 text-sm leading-relaxed mb-8 flex-grow">
                    We handle civil disputes, recovery suits, contract matters, property claims and all types of civil cases with a strategic approach.
                  </p>
                  <Link href="/contact" className="text-gold font-bold text-xs tracking-widest uppercase hover:text-navy transition-colors flex items-center gap-2">
                    Learn More <ArrowRight size={14} />
                  </Link>
                </div>
              </RevealItem>

              {/* Card 2: Family Law */}
              <RevealItem>
                <div className="bg-white border border-slate-100 p-10 flex flex-col items-center text-center transition-transform hover:-translate-y-2 hover:shadow-xl duration-500 rounded-sm h-full group">
                  <div className="w-20 h-20 rounded-full border border-gold flex items-center justify-center mb-6 bg-white group-hover:bg-gold/5 transition-colors">
                    <Users className="text-gold w-8 h-8" strokeWidth={1} />
                  </div>
                  <h3 className="font-serif font-bold text-navy text-2xl mb-4">Family Law</h3>
                  <div className="w-8 h-[2px] bg-gold mb-6 opacity-50"></div>
                  <p className="text-slate-600 text-sm leading-relaxed mb-8 flex-grow">
                    Our family law services include divorce, child custody, maintenance, succession and all family-related legal matters.
                  </p>
                  <Link href="/contact" className="text-gold font-bold text-xs tracking-widest uppercase hover:text-navy transition-colors flex items-center gap-2">
                    Learn More <ArrowRight size={14} />
                  </Link>
                </div>
              </RevealItem>

              {/* Card 3: Criminal Defense */}
              <RevealItem>
                <div className="bg-white border border-slate-100 p-10 flex flex-col items-center text-center transition-transform hover:-translate-y-2 hover:shadow-xl duration-500 rounded-sm h-full group">
                  <div className="w-20 h-20 rounded-full border border-gold flex items-center justify-center mb-6 bg-white group-hover:bg-gold/5 transition-colors">
                    <Gavel className="text-gold w-8 h-8" strokeWidth={1} />
                  </div>
                  <h3 className="font-serif font-bold text-navy text-2xl mb-4">Criminal Defense</h3>
                  <div className="w-8 h-[2px] bg-gold mb-6 opacity-50"></div>
                  <p className="text-slate-600 text-sm leading-relaxed mb-8 flex-grow">
                    We provide strong defense in bail, appeals, FIR quashment, criminal trials and all other criminal proceedings.
                  </p>
                  <Link href="/contact" className="text-gold font-bold text-xs tracking-widest uppercase hover:text-navy transition-colors flex items-center gap-2">
                    Learn More <ArrowRight size={14} />
                  </Link>
                </div>
              </RevealItem>

              {/* Card 4: Corporate Law */}
              <RevealItem>
                <div className="bg-white border border-slate-100 p-10 flex flex-col items-center text-center transition-transform hover:-translate-y-2 hover:shadow-xl duration-500 rounded-sm h-full group">
                  <div className="w-20 h-20 rounded-full border border-gold flex items-center justify-center mb-6 bg-white group-hover:bg-gold/5 transition-colors">
                    <Building className="text-gold w-8 h-8" strokeWidth={1} />
                  </div>
                  <h3 className="font-serif font-bold text-navy text-2xl mb-4">Corporate Law</h3>
                  <div className="w-8 h-[2px] bg-gold mb-6 opacity-50"></div>
                  <p className="text-slate-600 text-sm leading-relaxed mb-8 flex-grow">
                    From company formation to legal compliance, contracts and corporate advisory, we help your business stay protected and compliant.
                  </p>
                  <Link href="/contact" className="text-gold font-bold text-xs tracking-widest uppercase hover:text-navy transition-colors flex items-center gap-2">
                    Learn More <ArrowRight size={14} />
                  </Link>
                </div>
              </RevealItem>

              {/* Card 5: Property Law */}
              <RevealItem>
                <div className="bg-white border border-slate-100 p-10 flex flex-col items-center text-center transition-transform hover:-translate-y-2 hover:shadow-xl duration-500 rounded-sm h-full group">
                  <div className="w-20 h-20 rounded-full border border-gold flex items-center justify-center mb-6 bg-white group-hover:bg-gold/5 transition-colors">
                    <Home className="text-gold w-8 h-8" strokeWidth={1} />
                  </div>
                  <h3 className="font-serif font-bold text-navy text-2xl mb-4">Property Law</h3>
                  <div className="w-8 h-[2px] bg-gold mb-6 opacity-50"></div>
                  <p className="text-slate-600 text-sm leading-relaxed mb-8 flex-grow">
                    We deal in sale/purchase, transfers, leases, tenancy disputes, property documentation and real estate matters.
                  </p>
                  <Link href="/contact" className="text-gold font-bold text-xs tracking-widest uppercase hover:text-navy transition-colors flex items-center gap-2">
                    Learn More <ArrowRight size={14} />
                  </Link>
                </div>
              </RevealItem>

              {/* Card 6: Taxation */}
              <RevealItem>
                <div className="bg-white border border-slate-100 p-10 flex flex-col items-center text-center transition-transform hover:-translate-y-2 hover:shadow-xl duration-500 rounded-sm h-full group">
                  <div className="w-20 h-20 rounded-full border border-gold flex items-center justify-center mb-6 bg-white group-hover:bg-gold/5 transition-colors">
                    <FileText className="text-gold w-8 h-8" strokeWidth={1} />
                  </div>
                  <h3 className="font-serif font-bold text-navy text-2xl mb-4">Taxation</h3>
                  <div className="w-8 h-[2px] bg-gold mb-6 opacity-50"></div>
                  <p className="text-slate-600 text-sm leading-relaxed mb-8 flex-grow">
                    Our tax lawyers provide advice on income tax, sales tax, appeals, refunds and all taxation-related matters.
                  </p>
                  <Link href="/contact" className="text-gold font-bold text-xs tracking-widest uppercase hover:text-navy transition-colors flex items-center gap-2">
                    Learn More <ArrowRight size={14} />
                  </Link>
                </div>
              </RevealItem>

              {/* Card 7: Employment Law */}
              <RevealItem>
                <div className="bg-white border border-slate-100 p-10 flex flex-col items-center text-center transition-transform hover:-translate-y-2 hover:shadow-xl duration-500 rounded-sm h-full group">
                  <div className="w-20 h-20 rounded-full border border-gold flex items-center justify-center mb-6 bg-white group-hover:bg-gold/5 transition-colors">
                    <UsersRound className="text-gold w-8 h-8" strokeWidth={1} />
                  </div>
                  <h3 className="font-serif font-bold text-navy text-2xl mb-4">Employment Law</h3>
                  <div className="w-8 h-[2px] bg-gold mb-6 opacity-50"></div>
                  <p className="text-slate-600 text-sm leading-relaxed mb-8 flex-grow">
                    We assist both employers and employees with employment contracts, termination issues and workplace disputes.
                  </p>
                  <Link href="/contact" className="text-gold font-bold text-xs tracking-widest uppercase hover:text-navy transition-colors flex items-center gap-2">
                    Learn More <ArrowRight size={14} />
                  </Link>
                </div>
              </RevealItem>

              {/* Card 8: Intellectual Property */}
              <RevealItem>
                <div className="bg-white border border-slate-100 p-10 flex flex-col items-center text-center transition-transform hover:-translate-y-2 hover:shadow-xl duration-500 rounded-sm h-full group">
                  <div className="w-20 h-20 rounded-full border border-gold flex items-center justify-center mb-6 bg-white group-hover:bg-gold/5 transition-colors">
                    <ShieldCheck className="text-gold w-8 h-8" strokeWidth={1} />
                  </div>
                  <h3 className="font-serif font-bold text-navy text-2xl mb-4">Intellectual Property</h3>
                  <div className="w-8 h-[2px] bg-gold mb-6 opacity-50"></div>
                  <p className="text-slate-600 text-sm leading-relaxed mb-8 flex-grow">
                    We help protect your ideas and creations with trademark, copyright, patent registration and IP protection services.
                  </p>
                  <Link href="/contact" className="text-gold font-bold text-xs tracking-widest uppercase hover:text-navy transition-colors flex items-center gap-2">
                    Learn More <ArrowRight size={14} />
                  </Link>
                </div>
              </RevealItem>

            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 3. BOTTOM CTA SECTION */}
      <section className="py-24 px-8 bg-alabaster border-t border-slate-200 relative overflow-hidden">
        {/* Subtle Watermark */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none translate-x-1/4">
          <Scale className="w-[600px] h-[600px] text-navy" strokeWidth={0.5} />
        </div>

        <div className="max-w-[1600px] mx-auto relative z-10">
          <ScrollReveal>
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-12">
              <div className="max-w-xl">
                <span className="text-gold font-bold tracking-widest uppercase text-sm mb-4 block">Need Legal Assistance?</span>
                <h2 className="text-4xl md:text-5xl font-serif text-navy mb-6 tracking-tight leading-tight">
                  We're Here to Help You<br />
                  Find <span className="text-gold italic font-medium">the Right Solution.</span>
                </h2>
                <p className="text-slate-600 text-lg leading-relaxed">
                  Every case is unique. Book a consultation with our experienced lawyers and get the legal guidance you need.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/book-consultation"
                  className="inline-flex items-center justify-center space-x-3 px-8 py-4 bg-gold hover:bg-goldHover text-white font-medium rounded-sm transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1 uppercase tracking-wide text-sm"
                >
                  <span>Book a Consultation</span>
                  <ArrowRight size={18} />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center space-x-3 px-8 py-4 bg-white hover:bg-slate-50 text-navy font-bold rounded-sm border border-slate-200 transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-1 uppercase tracking-wide text-sm"
                >
                  <Phone size={18} className="text-gold" />
                  <span>Talk to our Experts</span>
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

    </div>
  );
}
