"use client";

import { useState, useEffect } from "react";
import { ScrollReveal, RevealItem } from "./ScrollReveal";
import { ReviewModal } from "./ReviewModal";
import { Star, ChevronDown, Quote, ChevronRight, Scale } from "lucide-react";

export type Review = {
  name: string;
  role: string;
  initials: string;
  text: string;
  practiceArea: string;
  rating?: number;
};

export function ReviewSystem({ initialReviews }: { initialReviews: Review[] }) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("law_firm_reviews");
    if (saved) {
      try {
        setReviews(JSON.parse(saved));
      } catch (e) {
        setReviews(initialReviews);
      }
    } else {
      setReviews(initialReviews);
    }
  }, [initialReviews]);

  const handleAddReview = (newReview: Review) => {
    const updated = [newReview, ...reviews];
    setReviews(updated);
    localStorage.setItem("law_firm_reviews", JSON.stringify(updated));
  };

  // Prevent hydration mismatch on the first render for localStorage
  const displayReviews = mounted ? reviews : initialReviews;

  return (
    <>
      {/* 2. REVIEWS GRID SECTION */}
      <section className="pt-32 pb-24 px-8">
        <div className="max-w-[1600px] mx-auto">
          
          <ScrollReveal>
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-8 h-[2px] bg-gold"></div>
                  <span className="text-gold font-bold tracking-widest uppercase text-xs">What Our Clients Say</span>
                </div>
                <h2 className="text-4xl font-serif text-navy">Real Stories. Real Results.</h2>
              </div>
              
              <div className="relative group min-w-[250px]">
                <button className="w-full flex items-center justify-between px-6 py-4 bg-white border border-slate-200 text-navy text-sm font-medium rounded-sm shadow-sm hover:border-gold transition-colors">
                  All Practice Areas
                  <ChevronDown size={16} className="text-slate-400 group-hover:text-gold transition-colors" />
                </button>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal staggerChildren delay={0.2}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {displayReviews.map((review, idx) => (
                <RevealItem key={idx}>
                  <div className="bg-white border border-slate-100 p-10 flex flex-col rounded-sm transition-transform hover:-translate-y-2 hover:shadow-xl duration-500 h-full relative overflow-hidden group">
                    
                    {/* Background Quote Watermark */}
                    <Quote className="absolute -bottom-4 -right-4 w-40 h-40 text-slate-50 opacity-[0.03] rotate-12 transition-transform duration-700 group-hover:scale-110" />

                    <div className="text-gold text-5xl font-serif leading-none opacity-40 mb-4 h-6">"</div>
                    <p className="text-slate-600 text-sm leading-relaxed mb-8 flex-grow relative z-10 font-medium">
                      {review.text}
                    </p>
                    
                    <div className="flex gap-1 mb-8 relative z-10">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${i < (review.rating || 5) ? "text-gold fill-gold" : "text-slate-200 fill-slate-50"}`} 
                        />
                      ))}
                    </div>

                    <div className="flex items-center gap-4 relative z-10 pt-6 border-t border-slate-100">
                      <div className="w-12 h-12 rounded-full bg-navy text-white flex items-center justify-center font-bold tracking-wider shadow-md">
                        {review.initials}
                      </div>
                      <div>
                        <h4 className="font-bold text-navy text-sm">{review.name}</h4>
                        <p className="text-xs text-slate-500">{review.role}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-6 relative z-10">
                      <div className="w-4 h-[2px] bg-gold"></div>
                      <span className="text-gold text-[10px] uppercase font-bold tracking-widest">{review.practiceArea}</span>
                    </div>
                  </div>
                </RevealItem>
              ))}
            </div>
          </ScrollReveal>

          {/* Pagination */}
          {displayReviews.length > 6 && (
            <ScrollReveal delay={0.4}>
              <div className="flex justify-center items-center gap-2 mt-12">
                <button className="w-10 h-10 flex items-center justify-center rounded-full bg-gold text-white font-bold shadow-md hover:bg-navy transition-colors">1</button>
                <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-slate-500 font-bold border border-slate-200 hover:border-gold hover:text-gold transition-colors">2</button>
                <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-slate-500 font-bold border border-slate-200 hover:border-gold hover:text-gold transition-colors">3</button>
                <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-slate-400 border border-slate-200 hover:border-gold hover:text-gold transition-colors"><ChevronRight size={16} /></button>
              </div>
            </ScrollReveal>
          )}

        </div>
      </section>

      {/* 3. SHARE YOUR EXPERIENCE SECTION */}
      <section className="py-20 px-8 mb-24">
        <div className="max-w-[1600px] mx-auto">
          <ScrollReveal>
            <div className="bg-white border border-slate-100 rounded-sm shadow-sm p-12 flex flex-col md:flex-row items-center justify-between gap-10 relative overflow-hidden">
              
              <Quote className="absolute top-1/2 -right-20 -translate-y-1/2 w-96 h-96 text-alabaster pointer-events-none" />

              <div className="flex items-center gap-10 relative z-10">
                <div className="w-24 h-24 rounded-full border border-gold/30 flex items-center justify-center bg-alabaster flex-shrink-0">
                  <Scale className="text-gold w-10 h-10" strokeWidth={1} />
                </div>
                <div>
                  <h3 className="text-3xl font-serif text-navy mb-2">Share Your Experience</h3>
                  <p className="text-slate-600 text-sm">We value your feedback. Your review helps us maintain the highest standards of legal services.</p>
                </div>
              </div>

              <ReviewModal onSubmitReview={handleAddReview} />
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
