import Image from "next/image";
import Link from "next/link";
import { ScrollReveal, RevealItem } from "../../components/ScrollReveal";
import { ArrowRight, ShieldCheck, Star, Users, Target, UsersRound, Gavel, Handshake, Lock, Landmark, Briefcase, Trophy } from "lucide-react";

export const metadata = {
  title: "About Us | Rahimullah Advocate Law Chamber Swat",
  description: "Learn more about our dedication to justice and commitment to our clients.",
};

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">

      {/* 1. HERO SECTION */}
      <section className="relative w-full h-[60vh] min-h-[500px] flex items-center overflow-hidden bg-navy">
        <Image
          src="/images/hero-bg.png"
          alt="Courthouse Pillars"
          fill
          sizes="100vw"
          className="object-cover object-center opacity-70 mix-blend-overlay"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent"></div>

        <div className="relative z-10 max-w-[1600px] mx-auto w-full px-8">
          <ScrollReveal>
            <div className="max-w-2xl flex flex-col items-start text-left">
              <span className="text-gold font-bold tracking-widest uppercase text-sm mb-4">About Us</span>
              <h1 className="text-5xl md:text-6xl font-serif text-navy mb-6 tracking-tight leading-tight">
                Dedicated to Justice.<br />
                <span className="text-gold italic font-medium">Committed to You.</span>
              </h1>
              <p className="text-slate-600 text-lg leading-relaxed mb-10 max-w-lg">
                At Rahimullah Advocate Law Chamber Swat, we believe in providing exceptional legal services with integrity, dedication, and a client-first approach. Our mission is to deliver practical solutions and reliable representation to help you move forward with confidence.
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
      </section>

      {/* 2. OUR STORY SECTION */}
      <section className="py-24 px-8 bg-alabaster">
        <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

          <ScrollReveal>
            <div className="flex flex-col">
              <h2 className="text-4xl font-serif text-navy mb-6">Our Story</h2>
              <div className="w-16 h-1 bg-gold mb-8"></div>

              <div className="space-y-6 text-slate-600 leading-relaxed text-lg mb-12">
                <p>
                  Founded with a vision to provide accessible, ethical, and result-oriented legal services, Rahimullah Advocate Law Chamber Swat has grown into a trusted name for individuals, businesses, and organizations.
                </p>
                <p>
                  Our firm combines deep legal expertise with a personalized approach, ensuring every client receives the attention and representation they deserve.
                </p>
              </div>

              {/* Signature block placeholder - using styled text for now */}
              <div className="mt-4">
                <div className="font-serif italic text-4xl text-navy mb-2 opacity-80" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Rahimullah
                </div>
                <h4 className="font-bold text-navy">Rahimullah Advocate</h4>
                <p className="text-slate-500 text-sm">Founder & Principal Attorney</p>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <div className="relative">
              <div className="relative h-[600px] w-full rounded-sm overflow-hidden shadow-2xl">
                <Image
                  src="/images/scales_of_justice.png"
                  alt="Scales of Justice"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>

              {/* Overlapping Floating Card */}
              <div className="absolute top-1/2 -right-8 -translate-y-1/2 bg-white/95 backdrop-blur-xl p-8 shadow-2xl rounded-sm border border-slate-100 hidden md:block w-80">
                <div className="space-y-8">
                  <div className="flex items-start gap-4">
                    <ShieldCheck className="text-gold w-8 h-8 flex-shrink-0" strokeWidth={1.5} />
                    <div>
                      <h4 className="font-bold text-navy mb-1">Integrity</h4>
                      <p className="text-sm text-slate-500 leading-relaxed">We uphold the highest ethical standards in everything we do.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Star className="text-gold w-8 h-8 flex-shrink-0" strokeWidth={1.5} />
                    <div>
                      <h4 className="font-bold text-navy mb-1">Excellence</h4>
                      <p className="text-sm text-slate-500 leading-relaxed">We are committed to delivering quality legal solutions.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Users className="text-gold w-8 h-8 flex-shrink-0" strokeWidth={1.5} />
                    <div>
                      <h4 className="font-bold text-navy mb-1">Client Focused</h4>
                      <p className="text-sm text-slate-500 leading-relaxed">Your goals are our priority. We listen, understand, and act.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Target className="text-gold w-8 h-8 flex-shrink-0" strokeWidth={1.5} />
                    <div>
                      <h4 className="font-bold text-navy mb-1">Results Driven</h4>
                      <p className="text-sm text-slate-500 leading-relaxed">We are dedicated to achieving the best possible outcomes.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>

        </div>
      </section>

      {/* 3. WHY CHOOSE US SECTION */}
      <section className="py-24 px-8 bg-white">
        <div className="max-w-[1600px] mx-auto">
          <ScrollReveal>
            <h2 className="text-4xl font-serif text-navy mb-6">Why Choose Us</h2>
            <div className="w-16 h-1 bg-gold mb-16"></div>
          </ScrollReveal>

          <ScrollReveal staggerChildren>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

              <RevealItem>
                <div className="bg-alabaster border border-slate-100 p-10 flex flex-col items-center text-center transition-transform hover:-translate-y-2 hover:shadow-xl duration-500 h-full rounded-sm">
                  <UsersRound className="text-gold w-12 h-12 mb-6" strokeWidth={1} />
                  <h3 className="font-bold text-navy text-xl mb-4">Experienced Lawyers</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">Our team consists of highly qualified and experienced legal professionals.</p>
                </div>
              </RevealItem>

              <RevealItem>
                <div className="bg-alabaster border border-slate-100 p-10 flex flex-col items-center text-center transition-transform hover:-translate-y-2 hover:shadow-xl duration-500 h-full rounded-sm">
                  <Gavel className="text-gold w-12 h-12 mb-6" strokeWidth={1} />
                  <h3 className="font-bold text-navy text-xl mb-4">Proven Track Record</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">A history of successful outcomes across a wide range of cases.</p>
                </div>
              </RevealItem>

              <RevealItem>
                <div className="bg-alabaster border border-slate-100 p-10 flex flex-col items-center text-center transition-transform hover:-translate-y-2 hover:shadow-xl duration-500 h-full rounded-sm">
                  <Handshake className="text-gold w-12 h-12 mb-6" strokeWidth={1} />
                  <h3 className="font-bold text-navy text-xl mb-4">Personalized Approach</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">We take the time to understand your unique situation and needs.</p>
                </div>
              </RevealItem>

              <RevealItem>
                <div className="bg-alabaster border border-slate-100 p-10 flex flex-col items-center text-center transition-transform hover:-translate-y-2 hover:shadow-xl duration-500 h-full rounded-sm">
                  <Lock className="text-gold w-12 h-12 mb-6" strokeWidth={1} />
                  <h3 className="font-bold text-navy text-xl mb-4">Confidential & Secure</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">Your information and case details are always completely protected.</p>
                </div>
              </RevealItem>

            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 4. STATS STRIP */}
      <section className="py-20 px-8 relative overflow-hidden bg-white">
        {/* Subtle patterned background for the stats strip like the design */}
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:20px_20px]"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-alabaster/80 via-transparent to-alabaster/80"></div>

        <div className="max-w-[1600px] mx-auto relative z-10">
          <ScrollReveal staggerChildren>
            <div className="bg-alabaster/60 backdrop-blur-sm border border-slate-200 rounded-sm p-12 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-12 divide-x divide-slate-200">
              <RevealItem>
                <div className="flex flex-col items-center text-center px-4">
                  <div className="flex items-center gap-4 mb-2">
                    <Landmark className="text-gold w-10 h-10" strokeWidth={1} />
                    <div className="text-5xl font-serif text-gold">20+</div>
                  </div>
                  <div className="text-slate-500 text-sm font-bold uppercase tracking-wider">Years of Experience</div>
                </div>
              </RevealItem>
              <RevealItem>
                <div className="flex flex-col items-center text-center px-4">
                  <div className="flex items-center gap-4 mb-2">
                    <Briefcase className="text-gold w-10 h-10" strokeWidth={1} />
                    <div className="text-5xl font-serif text-gold">1500+</div>
                  </div>
                  <div className="text-slate-500 text-sm font-bold uppercase tracking-wider">Cases Handled</div>
                </div>
              </RevealItem>
              <RevealItem>
                <div className="flex flex-col items-center text-center px-4">
                  <div className="flex items-center gap-4 mb-2">
                    <Trophy className="text-gold w-10 h-10" strokeWidth={1} />
                    <div className="text-5xl font-serif text-gold">98%</div>
                  </div>
                  <div className="text-slate-500 text-sm font-bold uppercase tracking-wider">Success Rate</div>
                </div>
              </RevealItem>
              <RevealItem>
                <div className="flex flex-col items-center text-center px-4">
                  <div className="flex items-center gap-4 mb-2">
                    <Users className="text-gold w-10 h-10" strokeWidth={1} />
                    <div className="text-5xl font-serif text-gold">500+</div>
                  </div>
                  <div className="text-slate-500 text-sm font-bold uppercase tracking-wider">Happy Clients</div>
                </div>
              </RevealItem>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 5. OUR COMMITMENT SECTION */}
      <section className="py-24 px-8 bg-alabaster">
        <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

          <ScrollReveal>
            <div className="flex flex-col">
              <h2 className="text-4xl font-serif text-navy mb-6">Our Commitment</h2>
              <div className="w-16 h-1 bg-gold mb-8"></div>

              <div className="space-y-6 text-slate-600 leading-relaxed text-lg mb-8">
                <p>
                  We are committed to making the legal process easier for our clients through clear communication, strategic advice, and unwavering support at every step.
                </p>
                <p className="font-bold text-navy">
                  Your trust is our responsibility.
                </p>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <div className="relative">
              <div className="relative h-[400px] w-full rounded-sm overflow-hidden shadow-2xl">
                <Image
                  src="/images/lawyer_signing.png"
                  alt="Lawyer Signing Document"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>

              {/* Overlapping Floating Quote Box */}
              <div className="absolute bottom-0 left-0 -translate-x-8 translate-y-8 bg-navy p-12 shadow-2xl rounded-sm hidden md:block w-[450px]">
                <div className="text-gold text-6xl font-serif leading-none opacity-80 mb-4">"</div>
                <p className="text-white text-xl font-serif leading-relaxed italic">
                  We don't just represent cases, we protect rights, build trust and deliver justice.
                </p>
              </div>
            </div>
          </ScrollReveal>

        </div>
      </section>

    </div>
  );
}
