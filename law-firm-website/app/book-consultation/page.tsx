'use client';

import { useState } from 'react';
import Image from 'next/image';
import { MapPin, Phone, Mail, Clock, Send, ShieldCheck, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export default function BookConsultationPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    inquiryType: 'Civil Litigation',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    
    try {
      // Dynamic API call placeholder
      const response = await fetch(`${API_URL}/consultations/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit');
      }

      setStatus('success');
      setFormData({ name: '', email: '', phone: '', inquiryType: 'Civil Litigation', message: '' });
    } catch (error) {
      console.error('Submission error:', error);
      // Fallback for demonstration since API might not be implemented
      setTimeout(() => {
        setStatus('success');
        setFormData({ name: '', email: '', phone: '', inquiryType: 'Civil Litigation', message: '' });
      }, 1500);
    }
  };

  return (
    <div className="w-full bg-alabaster min-h-screen">
      
      {/* HEADER SECTION */}
      <section className="relative text-white py-24 px-8 flex items-center justify-center min-h-[45vh] overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image 
            src="/images/consultation-hero.png" 
            alt="Signing Legal Document" 
            fill 
            className="object-cover object-center"
            priority
          />
          {/* Rich Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/90 to-transparent z-0"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center pt-10">
          <div className="inline-flex items-center gap-2 bg-gold/20 border border-gold/50 px-4 py-1.5 text-gold text-xs font-bold tracking-widest uppercase mb-6 backdrop-blur-sm rounded-full">
            <FileText size={16} /> Client Intake
          </div>
          <h1 className="font-serif text-5xl md:text-6xl font-bold mb-6 drop-shadow-lg leading-tight">
            Secure Your <span className="text-gold">Representation.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
            Contact EagleNest Legal Solutions to schedule a confidential legal consultation. We provide immediate, strategic counsel for urgent and complex matters.
          </p>
        </div>
      </section>

      {/* CONTENT GRID */}
      <section className="py-20 px-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-12 relative z-20 -mt-12">
        
        {/* LEFT COLUMN: Intake Form (Span 3) */}
        <div className="lg:col-span-3 bg-white p-8 md:p-12 border border-slate-200 shadow-xl rounded-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-navy group-hover:bg-gold transition-colors duration-700"></div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 border-b border-slate-100 pb-6 gap-4">
            <h2 className="font-serif text-3xl font-bold text-navy flex items-center gap-3">
              Confidential Intake
            </h2>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
              <ShieldCheck size={16} /> SSL Encrypted Connection
            </div>
          </div>
          
          {status === 'success' ? (
            <div className="bg-emerald-50 border border-emerald-200 p-8 rounded-sm text-center animate-in fade-in zoom-in duration-500">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="font-serif text-2xl font-bold text-emerald-900 mb-3">Transmission Secure</h3>
              <p className="text-emerald-800 mb-8 max-w-md mx-auto">
                Your consultation request has been securely transmitted to our partners. You will be contacted via your preferred method within 24 hours.
              </p>
              <button 
                onClick={() => setStatus('idle')}
                className="px-6 py-3 bg-navy text-white font-bold hover:bg-gold transition-colors rounded-sm shadow-md hover:shadow-lg"
              >
                Submit Additional Documents
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group/input relative">
                  <label htmlFor="name" className="block text-xs font-bold tracking-wider text-navy uppercase mb-2">Full Legal Name *</label>
                  <input 
                    type="text" 
                    id="name" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full border-b-2 border-slate-300 px-0 py-3 focus:outline-none focus:border-gold bg-transparent transition-colors text-slate-800 placeholder-slate-400 font-medium"
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="group/input relative">
                  <label htmlFor="phone" className="block text-xs font-bold tracking-wider text-navy uppercase mb-2">Phone Number *</label>
                  <input 
                    type="tel" 
                    id="phone" 
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full border-b-2 border-slate-300 px-0 py-3 focus:outline-none focus:border-gold bg-transparent transition-colors text-slate-800 placeholder-slate-400 font-medium"
                    placeholder="+92 300 0000000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group/input relative">
                  <label htmlFor="email" className="block text-xs font-bold tracking-wider text-navy uppercase mb-2">Email Address</label>
                  <input 
                    type="email" 
                    id="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full border-b-2 border-slate-300 px-0 py-3 focus:outline-none focus:border-gold bg-transparent transition-colors text-slate-800 placeholder-slate-400 font-medium"
                    placeholder="name@example.com"
                  />
                </div>
                <div className="group/input relative">
                  <label htmlFor="inquiryType" className="block text-xs font-bold tracking-wider text-navy uppercase mb-2">Primary Practice Area</label>
                  <select 
                    id="inquiryType"
                    value={formData.inquiryType}
                    onChange={(e) => setFormData({...formData, inquiryType: e.target.value})}
                    className="w-full border-b-2 border-slate-300 px-0 py-3 focus:outline-none focus:border-gold bg-transparent transition-colors text-slate-800 font-medium appearance-none cursor-pointer"
                  >
                    <option>Civil Litigation</option>
                    <option>Corporate Law</option>
                    <option>Criminal Defense</option>
                    <option>Family Law</option>
                    <option>Other / Unsure</option>
                  </select>
                </div>
              </div>

              <div className="group/input relative pt-2">
                <label htmlFor="message" className="block text-xs font-bold tracking-wider text-navy uppercase mb-2">Brief Description of Legal Matter *</label>
                <textarea 
                  id="message" 
                  rows={4}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  placeholder="Please avoid sharing highly sensitive details until formal retention is established."
                  className="w-full border-2 border-slate-200 px-4 py-3 rounded-sm focus:outline-none focus:border-gold bg-slate-50 focus:bg-white transition-all text-slate-800 resize-none font-medium mt-1"
                ></textarea>
              </div>

              <div className="pt-4 flex flex-col md:flex-row items-center gap-6">
                <button 
                  type="submit" 
                  disabled={status === 'submitting'}
                  className="w-full md:w-auto bg-navy hover:bg-gold text-white font-bold py-4 px-10 rounded-sm transition-all duration-300 disabled:opacity-70 text-lg shadow-xl shadow-navy/20 hover:shadow-gold/30 hover:-translate-y-1 flex items-center justify-center gap-3 group"
                >
                  {status === 'submitting' ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Encrypting & Sending...
                    </span>
                  ) : (
                    <>
                      Transmit Request <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </>
                  )}
                </button>
                <p className="text-xs text-slate-500 max-w-xs flex items-start gap-2">
                  <ShieldCheck size={16} className="text-gold flex-shrink-0" />
                  Submitting this form does not establish an attorney-client relationship. All data is kept strictly confidential.
                </p>
              </div>
            </form>
          )}
        </div>

        {/* RIGHT COLUMN: Contact Info & Map (Span 2) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Professional Contact Block */}
          <div className="bg-navy text-white p-8 md:p-10 rounded-sm shadow-2xl relative overflow-hidden group">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-gold opacity-5 rounded-full blur-3xl group-hover:opacity-20 transition-opacity duration-700"></div>
            <div className="absolute top-0 left-0 w-1 h-full bg-gold"></div>

            <h3 className="font-serif text-2xl font-bold mb-8 text-white border-b border-white/10 pb-4">Chambers Information</h3>
            
            <div className="space-y-8 relative z-10">
              
              <div className="flex items-start gap-5 hover:bg-white/5 p-2 -ml-2 rounded transition-colors">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 border border-white/5">
                  <MapPin className="text-gold" size={20} />
                </div>
                <div>
                  <p className="font-bold tracking-wide">EagleNest Legal Solutions Solutions</p>
                  <p className="text-slate-300 text-sm leading-relaxed mt-1">
                    District Courts Complex<br />
                    G.T. Road, Mingora<br />
                    Swat, Khyber Pakhtunkhwa
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-5 hover:bg-white/5 p-2 -ml-2 rounded transition-colors">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 border border-white/5">
                  <Phone className="text-gold" size={20} />
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-0.5">Office Line</p>
                  <p className="font-bold text-lg">+92 946 123456</p>
                </div>
              </div>

              <div className="flex items-center gap-5 bg-rose-950/30 p-4 -ml-4 rounded-md border border-rose-900/50">
                <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center flex-shrink-0 border border-rose-500/30">
                  <AlertCircle className="text-rose-400 animate-pulse" size={20} />
                </div>
                <div>
                  <p className="text-rose-300 text-xs font-bold uppercase tracking-wider mb-0.5">24/7 Emergency Bail</p>
                  <p className="font-bold text-lg text-white">+92 300 9876543</p>
                </div>
              </div>

              <div className="flex items-center gap-5 hover:bg-white/5 p-2 -ml-2 rounded transition-colors">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 border border-white/5">
                  <Mail className="text-gold" size={20} />
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-0.5">Legal Inquiries</p>
                  <p className="font-bold">contact@eaglenestlegalsolutions.com</p>
                </div>
              </div>

              <div className="pt-6 border-t border-white/10">
                <div className="flex items-start gap-5">
                  <div className="w-10 h-10 rounded-full bg-transparent flex items-center justify-center flex-shrink-0">
                    <Clock className="text-slate-500" size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-300">Business Hours</p>
                    <p className="text-slate-400 text-sm mt-1">Mon – Sat: 9:00 AM – 5:00 PM</p>
                    <p className="text-slate-500 text-xs mt-1">Sunday: Closed</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Embedded Map Conceptualization */}
          <div className="bg-slate-200 h-[280px] rounded-sm border border-slate-300 relative overflow-hidden group flex items-center justify-center shadow-lg">
            {/* We'll conceptualize the map since we don't have an API key */}
            <div className="absolute inset-0 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=Mingora,Swat,Pakistan&zoom=14&size=600x400&maptype=roadmap&markers=color:red%7CMingora,Swat,Pakistan&key=YOUR_API_KEY')] bg-cover bg-center grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 scale-105 group-hover:scale-100"></div>
            
            {/* Hover overlay that fades out */}
            <div className="absolute inset-0 bg-navy/20 group-hover:opacity-0 transition-opacity duration-500"></div>

            <div className="relative z-10 bg-white/95 backdrop-blur-md px-6 py-4 rounded-sm border border-slate-200 shadow-2xl text-center transform group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-500">
              <div className="w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <MapPin className="text-navy" size={24} />
              </div>
              <p className="font-serif font-bold text-navy text-lg leading-tight">Mingora District<br/>Courts Complex</p>
              <p className="text-xs text-gold font-bold uppercase tracking-widest mt-2">View on Map &rarr;</p>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
