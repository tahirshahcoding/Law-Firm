"use client";

import { useState } from "react";
import { Send, ShieldCheck } from "lucide-react";

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    inquiry_type: "Civil Litigation",
    message: "",
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccess(false);

    try {
      let baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/';
      if (!baseUrl.endsWith('/')) baseUrl += '/';
      const apiPrefix = baseUrl.endsWith('/api/') ? '' : 'api/';
      
      const response = await fetch(`${baseUrl}${apiPrefix}consultations/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess(true);
        setFormData({ name: "", email: "", phone: "", inquiry_type: "Civil Litigation", message: "" });
      } else {
        const data = await response.json().catch(() => ({}));
        setErrorMsg(data.error || "An error occurred. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-100 p-10 lg:p-14 rounded-sm shadow-xl relative overflow-hidden h-full">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-bl-[100px] pointer-events-none"></div>
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <h3 className="font-serif font-bold text-navy text-3xl mb-2">Send us a Message</h3>
        <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-sm text-xs font-bold uppercase tracking-wider">
          <ShieldCheck size={14} />
          <span>SSL Secure</span>
        </div>
      </div>
      <p className="text-slate-500 mb-10">Fill out the form below and we will get back to you shortly.</p>
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6 font-medium text-sm">
          Thank you! Your enquiry has been successfully submitted. We will contact you soon.
        </div>
      )}
      
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 font-medium text-sm">
          {errorMsg}
        </div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-navy uppercase tracking-wide">Full Legal Name <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              className="w-full border border-slate-200 rounded px-4 py-3 focus:outline-none focus:border-gold transition-colors placeholder:text-slate-400" 
              placeholder="As it appears on official documents" 
              required 
              disabled={loading} 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-navy uppercase tracking-wide">Phone Number <span className="text-red-500">*</span></label>
            <input 
              type="tel" 
              name="phone" 
              value={formData.phone} 
              onChange={handleChange} 
              className="w-full border border-slate-200 rounded px-4 py-3 focus:outline-none focus:border-gold transition-colors placeholder:text-slate-400" 
              placeholder="+92 300 0000000" 
              required 
              disabled={loading} 
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-navy uppercase tracking-wide">Email Address</label>
            <input 
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange} 
              className="w-full border border-slate-200 rounded px-4 py-3 focus:outline-none focus:border-gold transition-colors placeholder:text-slate-400" 
              placeholder="name@example.com" 
              disabled={loading} 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-navy uppercase tracking-wide">Primary Practice Area</label>
            <select 
              name="inquiry_type" 
              value={formData.inquiry_type} 
              onChange={handleChange} 
              className="w-full border border-slate-200 rounded px-4 py-3 focus:outline-none focus:border-gold transition-colors bg-white cursor-pointer"
              disabled={loading}
            >
              <option value="Civil Litigation">Civil Litigation</option>
              <option value="Family Law">Family Law</option>
              <option value="Criminal Defense">Criminal Defense</option>
              <option value="Corporate Law">Corporate Law</option>
              <option value="Property Law">Property Law</option>
              <option value="Taxation">Taxation</option>
              <option value="Employment Law">Employment Law</option>
              <option value="Intellectual Property">Intellectual Property</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-navy uppercase tracking-wide">Summary of Legal Matter <span className="text-red-500">*</span></label>
          <textarea 
            name="message" 
            value={formData.message} 
            onChange={handleChange} 
            rows={5} 
            className="w-full border border-slate-200 rounded px-4 py-3 focus:outline-none focus:border-gold transition-colors resize-none placeholder:text-slate-400 leading-relaxed" 
            placeholder="Please provide a brief summary of your legal matter. Kindly refrain from disclosing sensitive details until a formal attorney-client relationship has been established." 
            required 
            disabled={loading}
          ></textarea>
        </div>
        
        <div className="flex flex-col gap-3 pt-2">
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full inline-flex items-center justify-center space-x-3 px-8 py-4 bg-gold hover:bg-goldHover text-white font-medium rounded-sm transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 uppercase tracking-wide text-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <span>{loading ? "Submitting..." : "Submit Enquiry"}</span>
            {!loading && <Send size={16} />}
          </button>
          
          <div className="text-center text-slate-400 text-xs mt-2 px-4">
            <p>Submission of this form does not constitute or establish an attorney-client relationship.</p>
            <p>All information provided is treated with strict confidentiality.</p>
          </div>
        </div>
      </form>
    </div>
  );
}
