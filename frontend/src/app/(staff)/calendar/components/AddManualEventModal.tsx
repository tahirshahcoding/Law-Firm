'use client';

import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, AlignLeft } from 'lucide-react';
import { API_BASE, apiFetch, safeJson } from '@/lib/api';

interface AddManualEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddManualEventModal({ isOpen, onClose, onSuccess }: AddManualEventModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    event_type: 'Office Event',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    all_day: false,
    location: '',
    description: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Combine date and time
    const start_date = new Date(`${formData.date}T${formData.time}:00`).toISOString();

    const payload = {
      title: formData.title,
      event_type: formData.event_type,
      start_date,
      all_day: formData.all_day,
      location: formData.location,
      description: formData.description
    };

    try {
      const res = await apiFetch(`${API_BASE}/calendar-events/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || data.detail || 'Failed to create event');
      
      onSuccess();
      onClose();
      // Reset form
      setFormData({
        title: '', event_type: 'Office Event', date: new Date().toISOString().split('T')[0], 
        time: '09:00', all_day: false, location: '', description: ''
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
          <h2 className="text-xl font-bold text-slate-900">Add Manual Event</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-rose-50 text-rose-600 text-sm font-medium rounded-lg border border-rose-200">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Event Title</label>
            <input 
              required
              type="text" 
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="e.g. Annual Office Party"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Event Type</label>
            <select 
              value={formData.event_type}
              onChange={e => setFormData({...formData, event_type: e.target.value})}
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="Office Event">Office Event</option>
              <option value="Staff Leave">Staff Leave</option>
              <option value="Public Holiday">Public Holiday</option>
              <option value="Internal Task">Internal Task</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  required
                  type="date" 
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
            {!formData.all_day && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
                <div className="relative">
                  <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    required
                    type="time" 
                    value={formData.time}
                    onChange={e => setFormData({...formData, time: e.target.value})}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="all_day" 
              checked={formData.all_day}
              onChange={e => setFormData({...formData, all_day: e.target.checked})}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <label htmlFor="all_day" className="text-sm font-medium text-slate-700">All day event</label>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Location (Optional)</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="e.g. Conference Room A"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
            <div className="relative">
              <AlignLeft size={16} className="absolute left-3 top-3 text-slate-400" />
              <textarea 
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 min-h-[80px]"
                placeholder="Add any extra details..."
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors border border-slate-200"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all shadow-[0_4px_12px_rgba(37,99,235,0.25)] flex items-center justify-center min-w-[120px]"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Save Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
