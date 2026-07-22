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
    inquiry_type: 'Civil Litigation',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    
    try {
      const response = await fetch(`${API_URL}/consultations/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      setStatus('success');
      setFormData({ name: '', email: '', phone: '', inquiry_type: 'Civil Litigation', message: '' });
    } catch (error) {
      console.error('Submission error:', error);
      setStatus('error');
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
            <FileText size={16} /> Legal Consultation
          </div>
          <h1 className="font-serif text-5xl md:text-6xl font-bold mb-6 drop-shadow-lg leading-tight">
            Request a <span className="text-gold">Consultation.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
            We invite you to contact Rahimullah Advocate to arrange a confidential legal consultation. Our chambers provide professional counsel across a broad range of civil, criminal, and corporate matters.
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
              Consultation Request Form
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
              <h3 className="font-serif text-2xl font-bold text-emerald-900 mb-3">Enquiry Received</h3>
              <p className="text-emerald-800 mb-8 max-w-md mx-auto">
                Your consultation request has been received and will be reviewed by our chambers. A member of our team will contact you within one business day to confirm your appointment.
              </p>
              <button 
                onClick={() => setStatus('idle')}
                className="px-6 py-3 bg-navy text-white font-bold hover:bg-gold transition-colors rounded-sm shadow-md hover:shadow-lg"
              >
                Submit Another Enquiry
              </button>
            </div>
          ) : status === 'error' ? (
            <div className="bg-rose-50 border border-rose-200 p-8 rounded-sm text-center">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={32} />
              </div>
              <h3 className="font-serif text-2xl font-bold text-rose-900 mb-3">Submission Unsuccessful</h3>
              <p className="text-rose-700 mb-8 max-w-md mx-auto">
                We were unable to process your request at this time. Kindly contact our office directly at <strong>+92 946 123456</strong> or attempt your submission again shortly.
              </p>
              <button 
                onClick={() => setStatus('idle')}
                className="px-6 py-3 bg-navy text-white font-bold hover:bg-rose-600 transition-colors rounded-sm shadow-md"
              >
                Retry Submission
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
                    placeholder="As it appears on official documents"
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
                  <label htmlFor="inquiry_type" className="block text-xs font-bold tracking-wider text-navy uppercase mb-2">Primary Practice Area</label>
                  <select 
                    id="inquiry_type"
                    value={formData.inquiry_type}
                    onChange={(e) => setFormData({...formData, inquiry_type: e.target.value})}
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
                <label htmlFor="message" className="block text-xs font-bold tracking-wider text-navy uppercase mb-2">Summary of Legal Matter *</label>
                <textarea 
                  id="message" 
                  rows={4}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  placeholder="Please provide a brief summary of your legal matter. Kindly refrain from disclosing sensitive details until a formal attorney-client relationship has been established."
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
                      Submitting...
                    </span>
                  ) : (
                    <>
                      Submit Enquiry <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </>
                  )}
                </button>
                <p className="text-xs text-slate-500 max-w-xs flex items-start gap-2">
                  <ShieldCheck size={16} className="text-gold flex-shrink-0" />
                  Submission of this form does not constitute or establish an attorney-client relationship. All information provided is treated with strict confidentiality.
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
                  <p className="font-bold tracking-wide">Rahimullah Advocate</p>
                  <p className="text-slate-300 text-sm leading-relaxed mt-1">
                    Opposite Tehsil Courts 1st Floor,<br />
                    Hassan Trade Center Kabal, Swat
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-5 hover:bg-white/5 p-2 -ml-2 rounded transition-colors">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 border border-white/5">
                  <Phone className="text-gold" size={20} />
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-0.5">Office Line</p>
                  <p className="font-bold text-lg">0345-9309670</p>
                </div>
              </div>

              <div className="flex items-center gap-5 hover:bg-white/5 p-2 -ml-2 rounded transition-colors">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 border border-white/5">
                  <Mail className="text-gold" size={20} />
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-0.5">Legal Inquiries</p>
                  <p className="font-bold">rahimullahadvocate@gmail.com</p>
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
