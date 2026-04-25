'use client';

import Link from 'next/link';
import { Scale, Phone, Mail, MapPin, ChevronRight, Shield, Users, Briefcase, Heart } from 'lucide-react';
import Image from 'next/image';

const practiceAreas = [
  {
    icon: Scale,
    title: 'Civil Litigation',
    description: 'Comprehensive representation in civil disputes, property matters, and contract enforcement across all courts of Swat.',
    color: 'from-blue-600 to-blue-800',
    lightColor: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    icon: Briefcase,
    title: 'Corporate Law',
    description: 'Strategic legal counsel for businesses — from formation and compliance to mergers, acquisitions, and commercial contracts.',
    color: 'from-amber-600 to-amber-800',
    lightColor: 'bg-amber-50',
    iconColor: 'text-amber-600',
  },
  {
    icon: Shield,
    title: 'Criminal Defense',
    description: 'Vigorous and principled defense in criminal proceedings. We protect your rights at every stage of the legal process.',
    color: 'from-rose-600 to-rose-800',
    lightColor: 'bg-rose-50',
    iconColor: 'text-rose-600',
  },
  {
    icon: Heart,
    title: 'Family Law',
    description: 'Compassionate guidance through divorce, custody, inheritance, and matrimonial disputes, with sensitivity and discretion.',
    color: 'from-emerald-600 to-emerald-800',
    lightColor: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
];

export default function PublicHomePage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ─── Navbar ─────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 border border-slate-200 shadow-sm">
              <Image src="/logo.png" alt="EagleNest Logo" fill className="object-cover scale-[1.15]" sizes="32px" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">EagleNest <span className="text-blue-700">Legal</span></span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#practice-areas" className="hover:text-blue-700 transition-colors">Practice Areas</a>
            <a href="#contact" className="hover:text-blue-700 transition-colors">Contact</a>
          </nav>
          <div className="flex items-center gap-3">
            <a
              href="https://clientcounsel.vercel.app"
              className="text-sm font-semibold text-blue-700 hover:text-blue-900 transition-colors"
            >
              Client Portal
            </a>
            <a
              href="https://clientcounsel.vercel.app"
              className="hidden sm:flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm transition-all"
            >
              Login <ChevronRight size={16} />
            </a>
          </div>
        </div>
      </header>

      {/* ─── Hero Section ────────────────────────── */}
      <section
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `url('/hero-bg.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-blue-950/70 to-slate-900/80" />
        
        {/* Decorative gold lines */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />
        
        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto pt-24">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-amber-300 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-8 shadow-lg">
            <Scale size={12} />
            Serving Swat Valley Since 2005
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight tracking-tight mb-6">
            Expert Legal Solutions
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">
              in Swat
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed mb-12">
            Trusted advocacy and counsel for individuals and businesses across Khyber Pakhtunkhwa. 
            We combine local expertise with modern legal strategy to protect what matters most to you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#contact"
              className="group inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-8 py-4 rounded-xl text-base shadow-xl shadow-amber-500/30 transition-all duration-300 hover:scale-105"
            >
              Book a Consultation
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="https://clientcounsel.vercel.app"
              className="group inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white font-semibold px-8 py-4 rounded-xl text-base transition-all duration-300"
            >
              Client Portal Login
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40 text-xs animate-bounce">
          <div className="w-px h-10 bg-gradient-to-b from-white/30 to-transparent" />
          Scroll
        </div>
      </section>

      {/* ─── Practice Areas ──────────────────────── */}
      <section id="practice-areas" className="py-28 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-blue-700 font-bold text-sm uppercase tracking-widest mb-3">What We Do</p>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4">Our Practice Areas</h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              Decades of experience across the key areas of law that affect your life and business.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {practiceAreas.map((area) => {
              const Icon = area.icon;
              return (
                <div
                  key={area.title}
                  className="group bg-white rounded-2xl p-8 border border-slate-100 hover:border-blue-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-default"
                >
                  <div className={`w-14 h-14 ${area.lightColor} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={area.iconColor} size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{area.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{area.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Why Us Banner ───────────────────────── */}
      <section className="py-20 px-6 bg-gradient-to-br from-blue-900 to-slate-900 text-white">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
          {[
            { num: '20+', label: 'Years of Experience' },
            { num: '1,200+', label: 'Cases Won' },
            { num: '98%', label: 'Client Satisfaction' },
          ].map(stat => (
            <div key={stat.label}>
              <p className="text-5xl font-bold text-amber-400 mb-2">{stat.num}</p>
              <p className="text-slate-300 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Contact ─────────────────────────────── */}
      <section id="contact" className="py-28 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-blue-700 font-bold text-sm uppercase tracking-widest mb-3">Get In Touch</p>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">Book a Consultation</h2>
            <p className="text-slate-500 text-lg max-w-lg mx-auto">
              Reach out today for a confidential discussion about your legal needs.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { icon: Phone, label: 'Call Us', value: '+92 300 123 4567', sub: 'Mon–Sat, 9am to 6pm' },
              { icon: Mail, label: 'Email Us', value: 'info@eaglenestlegal.pk', sub: 'We reply within 24 hours' },
              { icon: MapPin, label: 'Visit Us', value: 'Bar Association Road', sub: 'Mingora, Swat' },
            ].map(item => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex flex-col items-center text-center p-8 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-100 hover:shadow-lg transition-all">
                  <div className="w-14 h-14 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center mb-5">
                    <Icon size={26} />
                  </div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                  <p className="text-slate-900 font-semibold text-base mb-1">{item.value}</p>
                  <p className="text-slate-400 text-sm">{item.sub}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────── */}
      <footer className="bg-slate-950 text-slate-400 py-10 px-6 text-center text-sm">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Scale className="text-amber-500" size={18} />
          <span className="font-bold text-white">EagleNest Legal Solutions</span>
        </div>
        <p>© {new Date().getFullYear()} EagleNest Legal Solutions, Swat. All rights reserved.</p>
        <p className="mt-2">
          <a href="https://clientcounsel.vercel.app" className="text-blue-400 hover:text-blue-300 underline">Client Portal</a>
          {' · '}
          <Link href="/login" className="text-slate-500 hover:text-slate-300">Staff Login</Link>
        </p>
      </footer>
    </div>
  );
}
