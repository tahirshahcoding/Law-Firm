"use client";

import { useState } from "react";
import { ArrowRight, Star, X, CheckCircle2 } from "lucide-react";
import { Review } from "./ReviewSystem";

export function ReviewModal({ onSubmitReview }: { onSubmitReview?: (review: Review) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);

      // Add review
      if (onSubmitReview) {
        const nameInput = document.getElementById("name") as HTMLInputElement;
        const practiceAreaInput = document.getElementById("practiceArea") as HTMLSelectElement;
        const reviewInput = document.getElementById("review") as HTMLTextAreaElement;

        const initials = nameInput.value.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();

        onSubmitReview({
          name: nameInput.value,
          role: "Client",
          initials,
          text: reviewInput.value,
          practiceArea: practiceAreaInput.value,
          rating,
        });
      }

      // Auto close after success
      setTimeout(() => {
        setIsOpen(false);
        // Reset form state after closing
        setTimeout(() => {
          setIsSuccess(false);
          setRating(0);
        }, 500);
      }, 3000);
    }, 1500);
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center space-x-3 px-8 py-4 bg-white hover:bg-slate-50 text-navy font-bold rounded-sm border border-slate-200 transition-all duration-300 shadow-sm hover:shadow-md hover:border-gold uppercase tracking-wide text-sm relative z-10 flex-shrink-0 group"
      >
        <span>Write a Review</span>
        <ArrowRight size={18} className="text-gold transform group-hover:translate-x-1 transition-transform" />
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm">
          {/* Modal Content */}
          <div
            className="bg-white w-full max-w-lg rounded-sm shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-navy transition-colors z-10 p-2"
            >
              <X size={24} />
            </button>

            {isSuccess ? (
              <div className="p-16 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 size={40} />
                </div>
                <h3 className="text-3xl font-serif text-navy mb-4">Thank You!</h3>
                <p className="text-slate-600">Your review has been successfully submitted and is pending moderation.</p>
              </div>
            ) : (
              <div className="p-10">
                <h3 className="text-3xl font-serif text-navy mb-2">Share Your Experience</h3>
                <p className="text-slate-500 text-sm mb-8">Please fill out the form below to submit your review.</p>

                <form onSubmit={handleSubmit} className="space-y-6">

                  {/* Rating Selector */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-navy mb-3">Your Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className="focus:outline-none transition-transform hover:scale-110"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(star)}
                        >
                          <Star
                            size={32}
                            className={`transition-colors duration-200 ${star <= (hoverRating || rating)
                                ? "text-gold fill-gold"
                                : "text-slate-200 fill-slate-50"
                              }`}
                            strokeWidth={1}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Name Input */}
                  <div>
                    <label htmlFor="name" className="block text-xs font-bold uppercase tracking-widest text-navy mb-2">Full Name</label>
                    <input
                      type="text"
                      id="name"
                      required
                      className="w-full px-4 py-3 border border-slate-200 rounded-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
                      placeholder="e.g. Tahir Shah"
                    />
                  </div>

                  {/* Practice Area Select */}
                  <div>
                    <label htmlFor="practiceArea" className="block text-xs font-bold uppercase tracking-widest text-navy mb-2">Practice Area</label>
                    <select
                      id="practiceArea"
                      required
                      className="w-full px-4 py-3 border border-slate-200 rounded-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors bg-white text-slate-700"
                    >
                      <option value="">Select a practice area</option>
                      <option value="Civil Litigation">Civil Litigation</option>
                      <option value="Family Law">Family Law</option>
                      <option value="Criminal Defense">Criminal Defense</option>
                      <option value="Corporate Law">Corporate Law</option>
                      <option value="Property Law">Property Law</option>
                      <option value="Taxation">Taxation</option>
                      <option value="Employment Law">Employment Law</option>
                      <option value="Intellectual Property">Intellectual Property</option>
                    </select>
                  </div>

                  {/* Review Text */}
                  <div>
                    <label htmlFor="review" className="block text-xs font-bold uppercase tracking-widest text-navy mb-2">Your Review</label>
                    <textarea
                      id="review"
                      rows={4}
                      required
                      className="w-full px-4 py-3 border border-slate-200 rounded-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors resize-none"
                      placeholder="Share your experience working with us..."
                    ></textarea>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting || rating === 0}
                    className="w-full py-4 bg-gold hover:bg-goldHover disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-sm transition-all duration-300 shadow-md uppercase tracking-widest text-sm flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      "Submit Review"
                    )}
                  </button>

                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
