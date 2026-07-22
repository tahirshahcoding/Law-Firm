import Image from "next/image";
import { ScrollReveal, RevealItem } from "../../components/ScrollReveal";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import ContactForm from "../../components/ContactForm";

export const metadata = {
  title: "Contact Us | Rahimullah Advocate Law Chamber Swat",
  description: "Get in touch with our legal team for a consultation.",
};

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen">

      {/* 1. HERO SECTION */}
      <section className="relative w-full h-[40vh] min-h-[400px] flex items-center overflow-hidden bg-navy">
        <Image
          src="/images/hero-bg.png"
          alt="Courthouse Pillars"
          fill
          sizes="100vw"
          className="object-cover object-center opacity-40 mix-blend-overlay"
          priority
        />

        <div className="relative z-10 max-w-[1600px] mx-auto w-full px-8 text-center pt-10">
          <ScrollReveal>
            <span className="text-gold font-bold tracking-widest uppercase text-sm mb-4 block">Get In Touch</span>
            <h1 className="text-5xl md:text-6xl font-serif text-white mb-6 tracking-tight leading-tight">
              Contact <span className="text-gold italic font-medium">Our Office</span>
            </h1>
            <p className="text-slate-300 text-lg leading-relaxed max-w-2xl mx-auto">
              We are here to answer your questions and provide the legal guidance you need. Reach out to schedule a consultation with our experts.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* 2. CONTACT CONTENT */}
      <section className="py-24 px-8 bg-alabaster">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16">

          {/* Left Column: Contact Info */}
          <ScrollReveal>
            <div className="flex flex-col h-full justify-between">
              <div>
                <h2 className="text-4xl font-serif text-navy mb-6">Our Information</h2>
                <div className="w-16 h-1 bg-gold mb-10"></div>
                <p className="text-slate-600 text-lg leading-relaxed mb-12">
                  Our team is ready to assist you. Whether you need immediate legal representation or just have a few questions, our doors and phone lines are always open.
                </p>

                <div className="space-y-8">
                  <div className="flex items-start gap-6 group">
                    <div className="w-14 h-14 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 group-hover:border-gold transition-colors shadow-sm">
                      <MapPin className="text-gold w-6 h-6" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h4 className="font-bold text-navy text-lg mb-1">Office Location</h4>
                      <p className="text-slate-600 leading-relaxed">
                        Opposite Tehsil Courts 1st Floor,<br />
                        Hassan Trade Center Kabal, Swat
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-6 group">
                    <div className="w-14 h-14 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 group-hover:border-gold transition-colors shadow-sm">
                      <Phone className="text-gold w-6 h-6" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h4 className="font-bold text-navy text-lg mb-1">Phone Number</h4>
                      <p className="text-slate-600 leading-relaxed">
                        0345-9309670
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-6 group">
                    <div className="w-14 h-14 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 group-hover:border-gold transition-colors shadow-sm">
                      <Mail className="text-gold w-6 h-6" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h4 className="font-bold text-navy text-lg mb-1">Email Address</h4>
                      <p className="text-slate-600 leading-relaxed">
                        rahimullahadvocate@gmail.com
                      </p>
                    </div>
                  </div>


                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Right Column: Contact Form */}
          <ScrollReveal delay={0.2}>
            <ContactForm />
          </ScrollReveal>

        </div>
      </section>

    </div>
  );
}
