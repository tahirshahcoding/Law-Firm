'use client';

import { useState, useEffect } from 'react';
import { X, User, CreditCard, Phone, MapPin, RefreshCw, Copy, CheckCheck, Key, Shield } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface EditClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientData: any | null;
}

export default function EditClientModal({ isOpen, onClose, onSuccess, clientData }: EditClientModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ name: '', cnic: '', mobile_number: '', address: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset password state
  const [resetLoading, setResetLoading] = useState(false);
  const [newCredentials, setNewCredentials] = useState<{ portal_username: string; portal_password: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (clientData) {
      setFormData({ name: clientData.name || '', cnic: clientData.cnic || '', mobile_number: clientData.mobile_number || '', address: clientData.address || '' });
      setNewCredentials(null);
    }
  }, [clientData]);

  if (!isOpen || !clientData) return null;

  const handleCnicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    let formatted = '';
    if (value.length > 0) { formatted = value.substring(0, 5); }
    if (value.length > 5) { formatted += '-' + value.substring(5, 12); }
    if (value.length > 12) { formatted += '-' + value.substring(12, 13); }
    setFormData({ ...formData, cnic: formatted });
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleResetPassword = async () => {
    if (!window.confirm(`Reset portal password for ${clientData.name}? The old password will become invalid immediately.`)) return;
    setResetLoading(true);
    try {
      const res = await apiFetch(`http://localhost:8000/api/portal/reset-password/${clientData.id}/`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');
      setNewCredentials(data);
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`http://localhost:8000/api/clients/${clientData.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.detail || 'Failed to update client');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
          <h2 className="text-xl font-bold text-slate-900">Edit Client Profile</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"><X size={20} /></button>
        </div>

        <div className="overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-600 font-medium">{error}</div>}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <div className="relative"><User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" placeholder="John Doe" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">CNIC (National ID)</label>
              <div className="relative"><CreditCard size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" required value={formData.cnic} onChange={handleCnicChange}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono" placeholder="12345-6789012-3" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number</label>
              <div className="relative"><Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" required value={formData.mobile_number} onChange={(e) => setFormData({...formData, mobile_number: e.target.value})}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono" placeholder="+92 300 1234567" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Residential Address</label>
              <div className="relative"><MapPin size={16} className="absolute left-3 top-3 text-slate-400" />
                <textarea required rows={3} value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none" placeholder="123 Legal Avenue, City..." />
              </div>
            </div>

            {/* Admin-only: Reset Portal Password */}
            {user?.role === 'Admin' && (
              <div className="pt-2 border-t border-slate-100">
                <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2"><Key size={15} className="text-amber-500" /> Client Portal Access</p>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-700">Portal Username</p>
                      <p className="text-slate-500 text-xs font-mono mt-0.5">{clientData.client_number}</p>
                    </div>
                    <button type="button" onClick={handleResetPassword} disabled={resetLoading}
                      className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 rounded-lg text-xs font-semibold transition-all disabled:opacity-50">
                      {resetLoading ? <div className="w-3 h-3 border-2 border-amber-400/30 border-t-amber-600 rounded-full animate-spin" /> : <RefreshCw size={13} />}
                      Reset Password
                    </button>
                  </div>

                  {/* New credentials after reset */}
                  {newCredentials && (
                    <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold"><Shield size={12} /> New Credentials (save immediately)</div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm font-bold text-slate-900">{newCredentials.portal_password}</span>
                        <button type="button" onClick={() => copyToClipboard(newCredentials.portal_password, 'reset')}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold transition-all ${copiedField === 'reset' ? 'bg-emerald-200 text-emerald-800' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}>
                          {copiedField === 'reset' ? <><CheckCheck size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-2">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 transition-colors">Cancel</button>
              <button type="submit" disabled={loading}
                className="px-6 py-2 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center min-w-[100px]">
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
