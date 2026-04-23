import { API_BASE } from '@/lib/api';
'use client';

import { useState } from 'react';
import { X, User, CreditCard, Phone, MapPin, Copy, CheckCheck, Key, Shield } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddClientModal({ isOpen, onClose, onSuccess }: AddClientModalProps) {
  const [formData, setFormData] = useState({ name: '', cnic: '', mobile_number: '', address: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Credentials shown after successful creation
  const [credentials, setCredentials] = useState<{ portal_username: string; portal_password: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCnicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    let formatted = '';
    if (value.length > 0) {
      formatted = value.substring(0, 5);
      if (value.length > 5) { formatted += '-' + value.substring(5, 12); }
      if (value.length > 12) { formatted += '-' + value.substring(12, 13); }
    }
    setFormData({ ...formData, cnic: formatted });
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('$\{API_BASE\}/clients/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.detail || 'Failed to create client');
      onSuccess();
      setFormData({ name: '', cnic: '', mobile_number: '', address: '' });
      // Show credentials instead of closing
      setCredentials({ portal_username: data.portal_username, portal_password: data.portal_password });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Credentials card (shown after creation) ─────────────
  if (credentials) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Shield size={22} />
              </div>
              <div>
                <h2 className="font-bold text-lg leading-none">Client Portal Access Created</h2>
                <p className="text-emerald-200 text-xs mt-0.5">Share these credentials with the client</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg p-3 flex items-start gap-2">
              <Key size={14} className="shrink-0 mt-0.5" />
              <p><strong>Important:</strong> This password is shown only once and cannot be recovered. Please note it down before closing.</p>
            </div>

            <div className="space-y-3">
              {/* Username */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Portal Username</p>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold text-slate-900 text-xl font-mono">{credentials.portal_username}</span>
                  <button onClick={() => copyToClipboard(credentials.portal_username, 'username')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${copiedField === 'username' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}>
                    {copiedField === 'username' ? <><CheckCheck size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
                  </button>
                </div>
              </div>

              {/* Password */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Portal Password</p>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold text-slate-900 text-xl font-mono tracking-wider">{credentials.portal_password}</span>
                  <button onClick={() => copyToClipboard(credentials.portal_password, 'password')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${copiedField === 'password' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}>
                    {copiedField === 'password' ? <><CheckCheck size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
                  </button>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500 text-center">Client can log in at <span className="font-semibold text-blue-600">localhost:3000/portal</span></p>

            <button onClick={() => { setCredentials(null); onClose(); }}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl transition-colors">
              Done — Close Window
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Form ─────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">Register New Client</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-600 font-medium">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                placeholder="Rizwan Ahmed" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">CNIC (National ID)</label>
            <div className="relative">
              <CreditCard size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" required value={formData.cnic} onChange={handleCnicChange}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 font-mono"
                placeholder="12345-6789012-3" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number</label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" required value={formData.mobile_number} onChange={(e) => setFormData({...formData, mobile_number: e.target.value})}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 font-mono"
                placeholder="+92 300 1234567" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Residential Address</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-3 text-slate-400" />
              <textarea required rows={3} value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 resize-none"
                placeholder="123 Legal Avenue, City..." />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 transition-colors">Cancel</button>
            <button type="submit" disabled={loading}
              className="px-6 py-2 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
