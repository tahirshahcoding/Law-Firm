import Link from "next/link";
import Image from "next/image";
import ContactForm from "../components/ContactForm";
import { Scale, Briefcase, Shield, Users, LockKeyhole, ArrowRight, Building, PenTool, BookOpen, User, ArrowUpRight, Search, Calendar, FileText, CreditCard, MessageSquare, Book, FileCheck, CheckCircle2, Award } from "lucide-react";
import { ScrollReveal, RevealItem } from "../components/ScrollReveal";

export default function Home() {
  return (
    <div className="w-full bg-white text-slate-800 font-sans overflow-hidden">
      
      {/* 1. HERO SECTION */}
      <section className="relative w-full h-[90vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image 
            src="/images/hero-bg.png" 
            alt="Law Firm Architecture" 
            fill 
            className="object-cover object-center"
            priority
          />
          {/* Light overlay for readability */}
          <div className="absolute inset-0 bg-white/40 z-0 backdrop-blur-[1px]"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/50 to-transparent z-0"></div>
        </div>

        <div className="relative z-10 max-w-[1600px] mx-auto w-full px-8 flex flex-col md:flex-row items-center justify-between h-full">
          {/* Hero Content */}
          <ScrollReveal delay={0.2}>
            <div className="max-w-3xl flex flex-col items-start text-left mt-16 md:mt-0">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-8 h-[2px] bg-gold"></div>
                <span className="text-gold font-bold tracking-widest uppercase text-sm">Dedicated to Justice. Committed to You.</span>
              </div>
              <h1 className="font-serif text-6xl lg:text-8xl font-bold leading-[1.05] mb-6 text-navy tracking-tight">
                Strategic Legal<br/>Solutions.<br/>
                <span className="text-gold italic font-medium font-serif mt-2 block">Proven Results.</span>
              </h1>
              <p className="text-xl text-slate-600 mb-10 max-w-lg leading-relaxed font-medium">
                We provide exceptional legal representation with integrity, expertise, and a relentless commitment to your success.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 w-full mb-12">
                <Link href="/book-consultation" className="bg-gold hover:bg-goldHover text-white px-10 py-5 text-sm font-bold rounded-sm transition-all duration-300 text-center flex items-center justify-center shadow-xl shadow-gold/20 hover:shadow-gold/40 hover:-translate-y-1">
                  BOOK CONSULTATION &rarr;
                </Link>
                <Link href="/hearings" className="bg-white hover:bg-slate-50 text-navy border border-slate-300 px-10 py-5 text-sm font-bold rounded-sm transition-all duration-300 text-center flex items-center justify-center shadow-md hover:shadow-lg hover:-translate-y-1">
                  TRACK YOUR CASE &rarr;
                </Link>
              </div>
              
              {/* Trusted By Clients */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-t border-slate-200/60 pt-6">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Trusted By 500+ Clients</span>
                <div className="flex items-center">
                  <div className="flex -space-x-3">
                    <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden"><img src="https://i.pravatar.cc/100?img=11" alt="client" /></div>
                    <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden"><img src="https://i.pravatar.cc/100?img=12" alt="client" /></div>
                    <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden"><img src="https://i.pravatar.cc/100?img=5" alt="client" /></div>
                    <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden"><img src="https://i.pravatar.cc/100?img=8" alt="client" /></div>
                  </div>
                  <div className="ml-4 bg-white border border-gold text-gold font-bold text-xs px-3 py-1.5 rounded-full shadow-sm">
                    500+
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
          
          {/* Floating Badge on Right */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 hidden lg:flex flex-col items-center bg-white/40 backdrop-blur-md px-12 py-16 shadow-2xl border-l border-y border-white/40 w-72 transition-transform hover:-translate-x-2 duration-500">
            <div className="relative w-20 h-20 flex items-center justify-center mb-10">
              <div className="absolute inset-0 rounded-full border border-gold/50 border-dashed animate-[spin_20s_linear_infinite]"></div>
              <div className="absolute inset-2 rounded-full border border-gold/80"></div>
              <Scale className="text-gold w-8 h-8 relative z-10" strokeWidth={1.5} />
            </div>
            <h3 className="text-navy font-bold text-[15px] tracking-[0.2em] uppercase text-center leading-[2.5]">
              Experience.<br/>Integrity.<br/>Results.
            </h3>
            <div className="w-12 h-[2px] bg-gold mt-10"></div>
          </div>
        </div>
      </section>

      {/* 2. STATS STRIP */}
      <section className="relative z-20 -mt-16 mx-auto max-w-[1400px] px-4 md:px-8 mb-32">
        <ScrollReveal delay={0.4}>
          <div className="bg-white/90 backdrop-blur-lg rounded-sm shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white grid grid-cols-2 md:grid-cols-4 py-10 px-4 gap-4 md:gap-0 md:divide-x md:divide-slate-100">
            <div className="flex flex-col items-center text-center p-4">
              <Building className="text-gold w-12 h-12 mb-4" strokeWidth={1.5}/>
              <div className="text-4xl font-serif font-bold text-navy mb-2">20+</div>
              <div className="text-slate-500 text-xs font-bold uppercase tracking-widest">Years of Experience</div>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <Briefcase className="text-gold w-12 h-12 mb-4" strokeWidth={1.5}/>
              <div className="text-4xl font-serif font-bold text-navy mb-2">1500+</div>
              <div className="text-slate-500 text-xs font-bold uppercase tracking-widest">Cases Handled</div>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <Award className="text-gold w-12 h-12 mb-4" strokeWidth={1.5}/>
              <div className="text-4xl font-serif font-bold text-navy mb-2">98%</div>
              <div className="text-slate-500 text-xs font-bold uppercase tracking-widest">Success Rate</div>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <Users className="text-gold w-12 h-12 mb-4" strokeWidth={1.5}/>
              <div className="text-4xl font-serif font-bold text-navy mb-2">500+</div>
              <div className="text-slate-500 text-xs font-bold uppercase tracking-widest">Happy Clients</div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* 3. PRACTICE AREAS & CLIENT PORTAL */}
      <section className="max-w-[1600px] mx-auto px-8 py-16 mb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          {/* Left Side: Practice Areas */}
          <div className="lg:col-span-8">
            <ScrollReveal>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-8 h-[2px] bg-gold"></div>
                <span className="text-gold font-bold tracking-widest uppercase text-xs">Our Practice Areas</span>
              </div>
              <h2 className="font-serif text-5xl font-bold text-navy mb-12 tracking-tight">
                Comprehensive Legal Services
              </h2>
            </ScrollReveal>
            
            <ScrollReveal staggerChildren={true}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {[
                  { title: 'Civil Litigation', icon: <Scale strokeWidth={1.5} className="w-12 h-12"/>, desc: 'Contract disputes, recovery suits, property matters and more.' },
                  { title: 'Family Law', icon: <Users strokeWidth={1.5} className="w-12 h-12"/>, desc: 'Divorce, child custody, maintenance, succession and family disputes.' },
                  { title: 'Criminal Defense', icon: <PenTool strokeWidth={1.5} className="w-12 h-12"/>, desc: 'Bail, appeals, FIR quashment, trial defense and representation.' },
                  { title: 'Corporate Law', icon: <Building strokeWidth={1.5} className="w-12 h-12"/>, desc: 'Company formation, compliance, contracts and legal advisory.' },
                  { title: 'Property Law', icon: <Building strokeWidth={1.5} className="w-12 h-12"/>, desc: 'Sale/purchase, transfers, leases, tenancy and real estate matters.' },
                  { title: 'Taxation', icon: <FileCheck strokeWidth={1.5} className="w-12 h-12"/>, desc: 'Income tax, sales tax, appeals, litigation, and advisory.' },
                ].map((area, i) => (
                  <RevealItem key={i} className="group bg-white p-10 border border-slate-100 shadow-sm rounded-sm hover:border-gold hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col items-center text-center">
                    <div className="text-gold mb-6 group-hover:scale-110 transition-transform duration-500">{area.icon}</div>
                    <h3 className="font-bold text-navy text-xl mb-4">{area.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed mb-8 flex-grow">{area.desc}</p>
                    <Link href={`/services#${area.title.toLowerCase().replace(' ', '-')}`} className="text-gold font-bold text-xs tracking-widest uppercase flex items-center gap-2 group-hover:gap-3 transition-all">
                      Learn More &rarr;
                    </Link>
                  </RevealItem>
                ))}
              </div>
            </ScrollReveal>
          </div>
          
          {/* Right Side: Client Portal Card */}
          <div className="lg:col-span-4 mt-12 lg:mt-0">
            <ScrollReveal delay={0.3}>
              <div className="bg-navy lg:bg-white text-white lg:text-slate-800 rounded-sm shadow-2xl border border-navy lg:border-slate-100 overflow-hidden h-full flex flex-col relative group hover:-translate-y-2 transition-all duration-500">
                <div className="absolute inset-0 bg-[url('/images/hero-bg.png')] bg-cover bg-center opacity-10 lg:opacity-5 grayscale group-hover:grayscale-0 group-hover:opacity-20 lg:group-hover:opacity-10 transition-all duration-700"></div>
                
                <div className="p-12 flex-grow relative z-10">
                  <div className="flex items-center gap-2 text-gold font-bold text-xs tracking-widest uppercase mb-8">
                    <LockKeyhole size={16} /> Client Portal
                  </div>
                  <h3 className="font-serif text-4xl font-bold mb-6 leading-tight tracking-tight">
                    Your Case.<br/>Always Accessible.
                  </h3>
                  <p className="text-slate-300 lg:text-slate-500 text-base mb-10 leading-relaxed">
                    Securely access your case details, documents, hearings and more.
                  </p>
                  <a href={process.env.NEXT_PUBLIC_PORTAL_URL || "https://clientcounsel.vercel.app"} className="bg-gold hover:bg-goldHover lg:bg-navy lg:hover:bg-slate-800 text-white w-full py-5 rounded-sm font-bold text-xs tracking-widest uppercase flex justify-center items-center gap-3 transition-all mb-10 shadow-xl hover:shadow-2xl hover:-translate-y-1">
                    LOGIN TO PORTAL &rarr;
                  </a>
                  
                  <ul className="space-y-5">
                    {[
                      { text: 'Track Case Progress', icon: <Search size={18}/> },
                      { text: 'Upcoming Hearings', icon: <Calendar size={18}/> },
                      { text: 'Documents & Files', icon: <FileText size={18}/> },
                      { text: 'Invoices & Payments', icon: <CreditCard size={18}/> },
                      { text: 'Messages & Updates', icon: <MessageSquare size={18}/> },
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-4 text-slate-200 lg:text-slate-600 text-sm font-bold">
                        <div className="text-gold bg-gold/20 lg:bg-gold/10 p-2 rounded-sm">{item.icon}</div>
                        {item.text}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-slate-800 lg:bg-slate-50 p-8 border-t border-slate-700 lg:border-slate-100 relative z-10 text-center">
                  <Link href="/contact" className="text-slate-300 hover:text-gold lg:text-slate-500 lg:hover:text-gold text-sm font-bold tracking-wide transition-colors">
                    New Client? Register Here &rarr;
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          </div>
          
        </div>
      </section>

      {/* 4. FEATURES BANNER */}
      <section className="border-y border-slate-100 bg-white">
        <ScrollReveal>
          <div className="max-w-[1600px] mx-auto px-8 py-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:divide-x lg:divide-slate-100">
              {[
                { title: 'Strategic Approach', desc: 'Tailored legal strategies designed for the best possible outcomes.', icon: <BookOpen className="text-gold" strokeWidth={1.5} size={32}/> },
                { title: 'Clear Communication', desc: 'We keep you informed at every step of the process.', icon: <Scale className="text-gold" strokeWidth={1.5} size={32}/> },
                { title: 'Confidential & Secure', desc: 'Your information is protected with the highest standards.', icon: <Shield className="text-gold" strokeWidth={1.5} size={32}/> },
                { title: 'Result Driven', desc: 'We are committed to achieving the best results for you.', icon: <User className="text-gold" strokeWidth={1.5} size={32}/> },
              ].map((f, i) => (
                <div key={i} className="flex gap-6 p-4 items-start group">
                  <div className="flex-shrink-0 mt-1 group-hover:scale-110 transition-transform duration-300">{f.icon}</div>
                  <div>
                    <h4 className="font-bold text-navy mb-3 text-lg">{f.title}</h4>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* 5. BOTTOM SECTION (Testimonials, Articles, Form) */}
      <section className="bg-slate-50 py-32 px-8">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          
          {/* Testimonial */}
          <ScrollReveal delay={0.1}>
            <div>
              <div className="flex justify-between items-end mb-10">
                <h4 className="font-bold text-xs tracking-widest text-slate-500 uppercase">What Our Clients Say</h4>
                <Link href="/reviews" className="text-xs font-bold text-gold flex items-center gap-1 hover:text-navy transition-colors tracking-wider uppercase">View All &rarr;</Link>
              </div>
              <div className="bg-white p-10 rounded-sm shadow-sm border border-slate-100 relative group hover:shadow-xl transition-shadow duration-500">
                <span className="text-8xl text-gold/10 font-serif absolute top-2 left-6 leading-none">"</span>
                <p className="text-slate-600 italic leading-relaxed relative z-10 mt-8 mb-10 text-base font-medium">
                  Excellent legal services with complete professionalism. They handled my case with great expertise and delivered the best possible outcome. Highly recommended.
                </p>
                <div className="flex gap-1 mb-6 text-gold">
                  {[1,2,3,4,5].map(star => <svg key={star} className="w-5 h-5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>)}
                </div>
                <div className="font-bold text-navy text-lg">— Umair Farooq</div>
                <div className="text-sm text-slate-500 font-medium">Business Owner</div>
                
                {/* Pagination Dots */}
                <div className="flex gap-2 mt-12 justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-gold"></div>
                  <div className="w-2 h-2 rounded-full bg-slate-300 mt-0.5"></div>
                  <div className="w-2 h-2 rounded-full bg-slate-300 mt-0.5"></div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Consultation Form */}
          <ScrollReveal delay={0.3}>
            <div className="h-full">
              <ContactForm />
            </div>
          </ScrollReveal>

        </div>
      </section>

    </div>
  );
}