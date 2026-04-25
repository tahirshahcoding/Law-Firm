import Link from "next/link";
import Image from "next/image";
import { Scale, Briefcase, Shield, Users, LockKeyhole, ArrowRight, CheckCircle2, Award, Building } from "lucide-react";

export default function Home() {
  return (
    <div className="w-full">
      
      {/* 1. HERO SECTION */}
      <section className="relative text-white py-32 px-8 flex items-center justify-center min-h-[85vh] overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image 
            src="/images/hero.png" 
            alt="Law Firm Office" 
            fill 
            className="object-cover object-center"
            priority
          />
          {/* Rich Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-navy/95 via-navy/80 to-transparent z-0"></div>
          <div className="absolute inset-0 bg-black/30 z-0"></div>
        </div>

        <div className="relative z-10 max-w-7xl w-full flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="max-w-3xl flex flex-col items-start text-left animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both">
            <div className="inline-flex items-center gap-2 bg-gold/20 border border-gold/50 px-4 py-2 text-gold text-sm font-bold tracking-widest uppercase mb-6 backdrop-blur-sm rounded-sm">
              <Scale size={16} /> Elite Legal Counsel in Swat
            </div>
            <h1 className="font-serif text-5xl md:text-7xl font-bold leading-[1.1] mb-6 drop-shadow-lg">
              Relentless Advocacy.<br/>
              <span className="text-gold">Proven Results.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-200 mb-10 max-w-2xl leading-relaxed drop-shadow-md">
              We provide aggressive representation and strategic counsel for businesses and individuals in Khyber Pakhtunkhwa. When your future is on the line, we protect your rights with uncompromising dedication.
            </p>
            <div className="flex flex-col sm:flex-row gap-5 w-full">
              <Link href="/book-consultation" className="group bg-gold hover:bg-goldHover text-white px-8 py-4 text-lg font-bold rounded-sm transition-all duration-300 w-full sm:w-auto text-center flex items-center justify-center gap-3 shadow-lg shadow-gold/20 hover:shadow-gold/40 hover:-translate-y-1">
                Book a Consultation
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href={process.env.NEXT_PUBLIC_PORTAL_URL || "https://clientcounsel.vercel.app"} className="group flex items-center justify-center gap-3 border border-white/40 bg-white/10 backdrop-blur-md hover:border-white hover:bg-white/20 text-white px-8 py-4 text-lg font-bold rounded-sm transition-all duration-300 w-full sm:w-auto text-center hover:-translate-y-1">
                <LockKeyhole size={20} className="text-gold" />
                Client Portal Login
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TRUST INDICATORS (STATS STRIP) */}
      <section className="bg-navy border-b border-white/10 relative z-20 -mt-8 mx-auto max-w-6xl shadow-2xl rounded-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10">
          <div className="p-8 flex items-center justify-center gap-6 group hover:bg-white/5 transition-colors">
            <Award className="text-gold w-12 h-12 flex-shrink-0 group-hover:scale-110 transition-transform duration-500" />
            <div>
              <div className="text-3xl font-serif font-bold text-white mb-1">25+</div>
              <div className="text-slate-400 text-sm font-medium tracking-wide uppercase">Years Experience</div>
            </div>
          </div>
          <div className="p-8 flex items-center justify-center gap-6 group hover:bg-white/5 transition-colors">
            <Scale className="text-gold w-12 h-12 flex-shrink-0 group-hover:scale-110 transition-transform duration-500" />
            <div>
              <div className="text-3xl font-serif font-bold text-white mb-1">98%</div>
              <div className="text-slate-400 text-sm font-medium tracking-wide uppercase">Success Rate</div>
            </div>
          </div>
          <div className="p-8 flex items-center justify-center gap-6 group hover:bg-white/5 transition-colors">
            <Building className="text-gold w-12 h-12 flex-shrink-0 group-hover:scale-110 transition-transform duration-500" />
            <div>
              <div className="text-3xl font-serif font-bold text-white mb-1">2,500+</div>
              <div className="text-slate-400 text-sm font-medium tracking-wide uppercase">Cases Resolved</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. ABOUT THE FIRM TEASER */}
      <section className="py-24 px-8 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
        <div className="flex-1 relative">
          <div className="absolute -inset-4 bg-gold/10 transform rotate-3 rounded-sm z-0"></div>
          <Image 
            src="/images/about.png" 
            alt="EagleNest Legal Solutions Solutions Legal Team" 
            width={600} 
            height={400} 
            className="relative z-10 w-full h-auto object-cover rounded-sm shadow-xl"
          />
        </div>
        <div className="flex-1 space-y-6">
          <h2 className="text-gold font-bold tracking-widest uppercase text-sm">Our Legacy</h2>
          <h3 className="font-serif text-4xl md:text-5xl font-bold text-navy leading-tight">
            Unwavering Commitment to Justice.
          </h3>
          <p className="text-lg text-slate-600 leading-relaxed">
            At EagleNest Legal Solutions Solutions, we don't just practice law; we master it. For over two decades, our firm has been the bedrock of legal defense and corporate strategy in Swat Valley. 
          </p>
          <ul className="space-y-4 mt-6">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="text-gold flex-shrink-0 mt-1" size={20} />
              <span className="text-slate-700">Senior partners directly handle every critical case phase.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="text-gold flex-shrink-0 mt-1" size={20} />
              <span className="text-slate-700">Deep-rooted relationships within the KP judicial system.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="text-gold flex-shrink-0 mt-1" size={20} />
              <span className="text-slate-700">Discreet, highly secure digital infrastructure for client data.</span>
            </li>
          </ul>
          <div className="pt-6">
            <Link href="/services" className="inline-flex items-center gap-2 border-b-2 border-gold text-navy font-bold pb-1 hover:text-gold transition-colors">
              Discover Our Approach <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* 4. PRACTICE AREAS GRID */}
      <section className="py-24 px-8 bg-slate-50 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-navy mb-6">Dedicated Legal Expertise</h2>
            <div className="h-1 w-20 bg-gold mx-auto mb-6"></div>
            <p className="text-slate-600 text-lg">We focus our formidable resources on key practice areas, ensuring our clients receive highly specialized, tactical representation.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Card 1 */}
            <div className="group bg-white p-10 border border-slate-200 shadow-sm hover:shadow-2xl hover:border-gold/50 transition-all duration-500 rounded-sm relative overflow-hidden flex flex-col hover:-translate-y-2">
              <div className="absolute top-0 left-0 w-full h-1 bg-transparent group-hover:bg-gold transition-colors duration-500"></div>
              <Scale className="text-navy group-hover:text-gold transition-colors duration-500 mb-6" size={48} />
              <h3 className="font-serif text-2xl font-bold text-navy mb-4">Civil Litigation</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-8 flex-grow">Resolving complex property, contract, and personal disputes with aggressive, evidence-backed representation.</p>
              <Link href="/services" className="inline-flex items-center gap-2 text-gold font-bold text-sm hover:text-navy transition-colors duration-200 uppercase tracking-wide">
                Learn More <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform duration-300"/>
              </Link>
            </div>

            {/* Card 2 */}
            <div className="group bg-white p-10 border border-slate-200 shadow-sm hover:shadow-2xl hover:border-gold/50 transition-all duration-500 rounded-sm relative overflow-hidden flex flex-col hover:-translate-y-2">
              <div className="absolute top-0 left-0 w-full h-1 bg-transparent group-hover:bg-gold transition-colors duration-500"></div>
              <Briefcase className="text-navy group-hover:text-gold transition-colors duration-500 mb-6" size={48} />
              <h3 className="font-serif text-2xl font-bold text-navy mb-4">Corporate Law</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-8 flex-grow">Structuring businesses, drafting contracts, and defending corporate entities to ensure your enterprise scales safely.</p>
              <Link href="/services" className="inline-flex items-center gap-2 text-gold font-bold text-sm hover:text-navy transition-colors duration-200 uppercase tracking-wide">
                Learn More <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform duration-300"/>
              </Link>
            </div>

            {/* Card 3 */}
            <div className="group bg-white p-10 border border-slate-200 shadow-sm hover:shadow-2xl hover:border-gold/50 transition-all duration-500 rounded-sm relative overflow-hidden flex flex-col hover:-translate-y-2">
              <div className="absolute top-0 left-0 w-full h-1 bg-transparent group-hover:bg-gold transition-colors duration-500"></div>
              <Shield className="text-navy group-hover:text-gold transition-colors duration-500 mb-6" size={48} />
              <h3 className="font-serif text-2xl font-bold text-navy mb-4">Criminal Defense</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-8 flex-grow">Strategic, uncompromising defense. We protect your freedom and constitutional rights at every stage.</p>
              <Link href="/services" className="inline-flex items-center gap-2 text-gold font-bold text-sm hover:text-navy transition-colors duration-200 uppercase tracking-wide">
                Learn More <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform duration-300"/>
              </Link>
            </div>

            {/* Card 4 */}
            <div className="group bg-white p-10 border border-slate-200 shadow-sm hover:shadow-2xl hover:border-gold/50 transition-all duration-500 rounded-sm relative overflow-hidden flex flex-col hover:-translate-y-2">
              <div className="absolute top-0 left-0 w-full h-1 bg-transparent group-hover:bg-gold transition-colors duration-500"></div>
              <Users className="text-navy group-hover:text-gold transition-colors duration-500 mb-6" size={48} />
              <h3 className="font-serif text-2xl font-bold text-navy mb-4">Family Law</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-8 flex-grow">Navigating sensitive divorces, custody battles, and inheritance disputes with absolute discretion.</p>
              <Link href="/services" className="inline-flex items-center gap-2 text-gold font-bold text-sm hover:text-navy transition-colors duration-200 uppercase tracking-wide">
                Learn More <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform duration-300"/>
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* 5. THE SECURE PORTAL FLEX */}
      <section className="bg-navy text-white py-24 px-8 border-t-4 border-gold relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gold/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        
        <div className="relative z-10 max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-gold text-xs font-bold tracking-widest uppercase mb-6 border border-white/20">
              <LockKeyhole size={14} /> Military-Grade Encryption
            </div>
            <h2 className="font-serif text-4xl md:text-5xl font-bold mb-6 leading-tight">The Modern Legal Standard:<br/>100% Secure Portal</h2>
            <p className="text-slate-300 leading-relaxed mb-10 text-lg">
              We don't leave your sensitive legal documents to chance. Every client receives private, 256-bit encrypted access to our digital portal. Track your case files, monitor court dates, and communicate directly with your legal team—securely, from anywhere in the world.
            </p>
            <a href={process.env.NEXT_PUBLIC_PORTAL_URL || "https://clientcounsel.vercel.app"} className="group inline-flex items-center gap-3 bg-white text-navy hover:bg-gold hover:text-white px-8 py-4 font-bold rounded-sm transition-all duration-300 shadow-xl hover:-translate-y-1">
              <LockKeyhole size={20} className="group-hover:animate-pulse" />
              Access Your Secure Vault
            </a>
          </div>
          
          <div className="flex-1 w-full relative">
            <div className="absolute inset-0 bg-gold blur-2xl opacity-20 transform translate-y-4"></div>
            <div className="w-full bg-slate-900 rounded-lg p-1 border border-slate-700 shadow-2xl relative overflow-hidden group">
               {/* Mockup UI representation */}
               <div className="bg-slate-800 rounded-md p-8 h-full">
                 <div className="flex items-center justify-between mb-8 border-b border-slate-700 pb-6">
                   <div className="flex items-center gap-4">
                     <div className="w-14 h-14 bg-navy rounded-md flex items-center justify-center border border-slate-600 shadow-inner">
                       <LockKeyhole className="text-gold" size={28} />
                     </div>
                     <div>
                       <div className="text-sm text-slate-400 font-medium">Connection Status</div>
                       <div className="font-bold text-emerald-400 flex items-center gap-2">
                         <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                         256-bit AES Encrypted
                       </div>
                     </div>
                   </div>
                 </div>
                 <div className="space-y-4 relative">
                   <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-slate-800 z-10"></div>
                   <div className="h-5 bg-slate-700 rounded w-3/4 animate-pulse"></div>
                   <div className="h-5 bg-slate-700 rounded w-1/2 animate-pulse delay-75"></div>
                   <div className="h-5 bg-slate-700 rounded w-5/6 animate-pulse delay-150"></div>
                   <div className="h-5 bg-slate-700 rounded w-2/3 animate-pulse delay-200"></div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}