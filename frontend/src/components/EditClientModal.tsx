'use client';

import { useState, useEffect } from 'react';
import { X, User, CreditCard, Phone, MapPin, RefreshCw, Copy, CheckCheck, Key, Shield, MessageCircle } from 'lucide-react';
import { API_BASE, apiFetch, safeJson } from '@/lib/api';
import { sendWhatsApp, credentialsResetMessage } from '@/lib/whatsapp';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';

interface EditClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientData: any | null;
}

export default function EditClientModal({ isOpen, onClose, onSuccess, clientData }: EditClientModalProps) {
  const { user } = useAuth();
  const { confirm, toast, showLoading, hideLoading } = useUI();
  const [formData, setFormData] = useState({ name: '', cnic: '', mobile_number: '', address: '' });
  const [error, setError] = useState<string | null>(null);

  // Reset password state
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
    const ok = await confirm({
      title: 'Reset Portal Password',
      message: `This will immediately invalidate the existing portal password for ${clientData.name}. A new password will be generated. Continue?`,
      confirmLabel: 'Reset Password',
      variant: 'warning',
    });
    if (!ok) return;
    
    try {
      showLoading('Resetting password...');
      const res = await apiFetch(`${API_BASE}/portal/reset-password/${clientData.id}/`, { method: 'POST' });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');
      setNewCredentials(data);
      toast.success('Password reset successfully.');

      // Auto-open WhatsApp with updated credentials
      const phone = formData.mobile_number || clientData.mobile_number;
      if (phone && data.portal_username && data.portal_password) {
        const message = credentialsResetMessage(
          formData.name || clientData.name,
          data.portal_username,
          data.portal_password,
        );
        sendWhatsApp(phone, message);
      }
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    } finally {
      hideLoading();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      showLoading('Updating client profile...');
      const res = await apiFetch(`${API_BASE}/clients/${clientData.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || data.detail || 'Failed to update client');
      toast.success('Client updated successfully');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      hideLoading();
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
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  {/* Username & Password Display */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-white border border-slate-100 p-2.5 rounded-lg">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Portal Username</p>
                        <p className="text-slate-800 text-sm font-mono font-bold mt-0.5">{clientData.client_number}</p>
                      </div>
                      <button type="button" onClick={() => copyToClipboard(clientData.client_number, 'username')}
                        className={`p-1.5 rounded transition-all ${copiedField === 'username' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}>
                        {copiedField === 'username' ? <CheckCheck size={14} /> : <Copy size={14} />}
                      </button>
                    </div>

                    <div className="flex items-center justify-between bg-white border border-slate-100 p-2.5 rounded-lg">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Portal Password</p>
                        <p className="text-slate-800 text-sm font-mono font-bold mt-0.5">{newCredentials?.portal_password || clientData.portal_password || 'Not Set'}</p>
                      </div>
                      <button type="button" onClick={() => copyToClipboard(newCredentials?.portal_password || clientData.portal_password || '', 'password')}
                        disabled={!newCredentials?.portal_password && !clientData.portal_password}
                        className={`p-1.5 rounded transition-all disabled:opacity-30 ${copiedField === 'password' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}>
                        {copiedField === 'password' ? <CheckCheck size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center justify-between pt-1">
                    <button type="button" onClick={handleResetPassword}
                      className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 rounded-lg text-xs font-bold transition-all disabled:opacity-50">
                      <RefreshCw size={13} />
                      Reset Password
                    </button>

                    {(newCredentials || clientData.portal_password) && (
                      <button type="button" onClick={() => {
                        const phone = formData.mobile_number || clientData.mobile_number;
                        const pass = newCredentials?.portal_password || clientData.portal_password;
                        if (phone && pass) {
                          const msg = credentialsResetMessage(
                            formData.name || clientData.name,
                            clientData.client_number,
                            pass,
                          );
                          sendWhatsApp(phone, msg);
                        }
                      }}
                        className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-all">
                        <MessageCircle size={13} /> WhatsApp
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-2">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 transition-colors">Cancel</button>
              <button type="submit"
                className="px-6 py-2 rounded-lg font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 duration-300 shadow-[0_4px_12px_rgba(37,99,235,0.25)] hover:shadow-[0_6px_16px_rgba(37,99,235,0.35)] hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center min-w-[100px] text-white">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
