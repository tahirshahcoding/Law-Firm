'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';
import { Lock, CheckCircle2, ShieldAlert } from 'lucide-react';
import { API_BASE, apiFetch } from '@/lib/api';

export default function SecuritySettingsPage() {
  const { user } = useAuth();
  const { showLoading, hideLoading } = useUI();
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });

  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!formData.password) {
      setMessage({ type: 'error', text: 'Please enter a new password.' });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    try {
      showLoading('Updating password...');
      const data = new FormData();
      data.append('password', formData.password);

      const res = await apiFetch(`${API_BASE}/users/me/`, {
        method: 'POST',
        body: data,
      });

      const resData = await res.json();
      
      if (res.ok) {
        setMessage({ type: 'success', text: 'Password updated successfully. You may need to log in again.' });
        setFormData({ password: '', confirmPassword: '' });
      } else {
        setMessage({ type: 'error', text: resData.error || 'Failed to update password.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Network error occurred.' });
    } finally {
      hideLoading();
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 w-full">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Security</h2>
        <p className="text-slate-500 mt-1">Manage your password and account security.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-slate-100 overflow-hidden">
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          {message && (
            <div className={`p-4 rounded-lg flex items-start gap-3 border ${
              message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'
            }`}>
              {message.type === 'success' ? <CheckCircle2 className="text-emerald-500 shrink-0" /> : <ShieldAlert className="text-rose-500 shrink-0" />}
              <p className="text-sm font-medium">{message.text}</p>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="pl-10 block w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  placeholder="Enter new password"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  className="pl-10 block w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  placeholder="Confirm new password"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 duration-300 shadow-[0_4px_12px_rgba(37,99,235,0.25)] hover:shadow-[0_6px_16px_rgba(37,99,235,0.35)] hover:-translate-y-0.5 px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 text-white"
            >
              Update Password
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
