import Image from "next/image";
import Link from "next/link";
import { ScrollReveal } from "../../components/ScrollReveal";
import { ReviewSystem } from "../../components/ReviewSystem";
import { ArrowRight, Star, Users, MessageSquare, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Client Reviews | Rahimullah Advocate Law Chamber Swat",
  description: "Read real stories and reviews from our satisfied clients.",
};

const reviews = [
  {
    name: "Ali Raza",
    role: "Business Owner",
    initials: "AR",
    text: "The team at Rahimullah Advocate Law Chamber Swat handled my property case with exceptional professionalism. They kept me informed at every step and the outcome was beyond my expectations.",
    practiceArea: "Property Law",
  },
  {
    name: "Sana Qureshi",
    role: "Doctor",
    initials: "SQ",
    text: "I was going through a difficult divorce and their family law team guided me with compassion and clarity. They truly care about their clients and fight for what's right.",
    practiceArea: "Family Law",
  },
  {
    name: "Usman Khan",
    role: "CEO, Tech Solutions",
    initials: "UK",
    text: "Professional, responsive, and highly knowledgeable. They resolved my company registration and compliance issues quickly and efficiently. Highly recommended!",
    practiceArea: "Corporate Law",
  },
  {
    name: "Hamza Malik",
    role: "Entrepreneur",
    initials: "HM",
    text: "Their criminal defense team is outstanding. They handled my case with great strategy and got me the best possible outcome. I'm extremely grateful for their support.",
    practiceArea: "Criminal Defense",
  },
  {
    name: "Bilal Ahmed",
    role: "Chartered Accountant",
    initials: "BA",
    text: "Excellent legal advice on taxation matters. They saved me from a major penalty and helped me plan my business taxes efficiently. Very professional team.",
    practiceArea: "Taxation",
  },
  {
    name: "Ayesha Noor",
    role: "Marketing Manager",
    initials: "AN",
    text: "From the first consultation to case resolution, their communication and dedication were excellent. I would trust them again for any legal matter.",
    practiceArea: "Civil Litigation",
  }
];

export default function ReviewsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-alabaster">

      {/* 1. HERO SECTION & STATS OVERLAY */}
      <section className="relative w-full h-[60vh] min-h-[550px] flex items-center bg-navy mb-24">
        <Image
          src="/images/hero-bg.png"
          alt="Courthouse Pillars"
          fill
          className="object-cover object-center opacity-70 mix-blend-overlay"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent"></div>

        <div className="relative z-10 max-w-[1600px] mx-auto w-full px-8 pb-32">
          <ScrollReveal>
            <div className="max-w-2xl flex flex-col items-start text-left">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-8 h-[2px] bg-gold"></div>
                <span className="text-gold font-bold tracking-widest uppercase text-sm">Client Reviews</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-serif text-navy mb-6 tracking-tight leading-tight">
                Trusted by Clients.<br />
                <span className="text-gold italic font-medium">Proven by Results.</span>
              </h1>
              <p className="text-slate-600 text-lg leading-relaxed mb-10 max-w-lg">
                Our clients' success stories reflect our commitment to excellence, integrity, and results that matter.
              </p>
              <Link
                href="/book-consultation"
                className="inline-flex items-center space-x-3 px-8 py-4 bg-gold hover:bg-goldHover text-white font-medium rounded-sm transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1 group uppercase tracking-wide text-sm"
              >
                <span>Book a Consultation</span>
                <ArrowRight size={18} className="transform group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </ScrollReveal>
        </div>

        {/* Floating Stats Block Overlay */}
        <div className="absolute -bottom-24 left-0 right-0 px-8 z-20">
          <div className="max-w-[1600px] mx-auto">
            <ScrollReveal delay={0.3}>
              <div className="bg-white/95 backdrop-blur-xl border border-slate-100 rounded-sm shadow-2xl p-10 lg:p-14">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-12 divide-x divide-slate-100">
                  <div className="flex flex-col items-center text-center px-4">
                    <div className="w-16 h-16 rounded-full border border-gold/30 flex items-center justify-center mb-6 bg-gold/5">
                      <Star className="text-gold w-6 h-6" strokeWidth={1.5} />
                    </div>
                    <div className="text-4xl font-serif text-navy mb-3">4.9</div>
                    <div className="flex gap-1 mb-3">
                      {[1, 2, 3, 4, 5].map(i => <Star key={i} className="text-gold w-4 h-4 fill-gold" />)}
                    </div>
                    <div className="text-slate-500 text-xs font-bold uppercase tracking-widest">Average Rating</div>
                  </div>

                  <div className="flex flex-col items-center text-center px-4">
                    <div className="w-16 h-16 rounded-full border border-gold/30 flex items-center justify-center mb-6 bg-gold/5">
                      <Users className="text-gold w-6 h-6" strokeWidth={1.5} />
                    </div>
                    <div className="text-4xl font-serif text-navy mb-3">500+</div>
                    <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-7">Happy Clients</div>
                  </div>

                  <div className="flex flex-col items-center text-center px-4">
                    <div className="w-16 h-16 rounded-full border border-gold/30 flex items-center justify-center mb-6 bg-gold/5">
                      <MessageSquare className="text-gold w-6 h-6" strokeWidth={1.5} />
                    </div>
                    <div className="text-4xl font-serif text-navy mb-3">650+</div>
                    <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-7">Reviews</div>
                  </div>

                  <div className="flex flex-col items-center text-center px-4">
                    <div className="w-16 h-16 rounded-full border border-gold/30 flex items-center justify-center mb-6 bg-gold/5">
                      <ShieldCheck className="text-gold w-6 h-6" strokeWidth={1.5} />
                    </div>
                    <div className="text-4xl font-serif text-navy mb-3">20+</div>
                    <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-7">Years of Excellence</div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <ReviewSystem initialReviews={reviews} />

    </div>
  );
}
