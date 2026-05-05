'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Search, Trash2, Phone, Mail, ChevronDown, RefreshCw, CheckCircle2, Clock, X } from 'lucide-react';
import { API_BASE, apiFetch } from '@/lib/api';
import { ListSkeleton } from '@/components/SkeletonLoaders';

type Consultation = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  inquiry_type: string;
  message: string;
  status: string;
  created_at: string;
};

const STATUS_STYLES: Record<string, string> = {
  New: 'bg-blue-50 text-blue-700 border-blue-200',
  Contacted: 'bg-amber-50 text-amber-700 border-amber-200',
  Converted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Closed: 'bg-slate-100 text-slate-500 border-slate-200',
};

export default function ConsultationsPage() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchConsultations = () => {
    setLoading(true);
    apiFetch(`${API_BASE}/consultations/`)
      .then(res => res.json())
      .then(data => {
        setConsultations(Array.isArray(data) ? data : data.results || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch consultations:', err);
        setLoading(false);
      });
  };

  useEffect(() => { fetchConsultations(); }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await apiFetch(`${API_BASE}/consultations/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchConsultations();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete consultation request from "${name}"?`)) return;
    try {
      await apiFetch(`${API_BASE}/consultations/${id}/`, { method: 'DELETE' });
      fetchConsultations();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const filtered = consultations.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      c.inquiry_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const counts = {
    All: consultations.length,
    New: consultations.filter(c => c.status === 'New').length,
    Contacted: consultations.filter(c => c.status === 'Contacted').length,
    Converted: consultations.filter(c => c.status === 'Converted').length,
    Closed: consultations.filter(c => c.status === 'Closed').length,
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Consultation Inquiries</h2>
          <p className="text-slate-500 mt-1 text-sm">Incoming client requests from the firm website.</p>
        </div>
        <button
          onClick={fetchConsultations}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all shadow-sm"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['All', 'New', 'Contacted', 'Converted', 'Closed'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
              filterStatus === s
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-600/20'
                : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-600'
            }`}
          >
            {s} <span className="ml-1 opacity-70 text-xs">{counts[s]}</span>
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          type="text"
          placeholder="Search by name, phone, or practice area..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-4">
          <ListSkeleton />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-24 text-center text-slate-400 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <MessageSquare size={40} className="mx-auto mb-4 text-slate-200" />
          <p className="font-medium text-slate-600">No consultation requests found.</p>
          <p className="text-sm mt-1">New requests from the website will appear here automatically.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:border-blue-200 transition-colors"
            >
              {/* Card Header */}
              <div
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
                onClick={() => setExpanded(expanded === c.id ? null : c.id)}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* Avatar */}
                  <div className="w-11 h-11 shrink-0 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold uppercase text-sm">
                    {c.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-900">{c.name}</p>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLES[c.status] || STATUS_STYLES['New']}`}>
                        {c.status}
                      </span>
                      <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                        {c.inquiry_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Phone size={11} />{c.phone}</span>
                      {c.email && <span className="flex items-center gap-1"><Mail size={11} />{c.email}</span>}
                      <span className="flex items-center gap-1"><Clock size={11} />{new Date(c.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <ChevronDown size={18} className={`text-slate-400 transition-transform duration-300 ${expanded === c.id ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {/* Expanded Detail */}
              {expanded === c.id && (
                <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                  {/* Message */}
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Legal Matter Description</p>
                    <p className="text-slate-700 text-sm leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                      {c.message}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
                    {/* Status changer */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Update Status:</span>
                      {(['New', 'Contacted', 'Converted', 'Closed'] as const).map(s => (
                        <button
                          key={s}
                          onClick={() => handleStatusChange(c.id, s)}
                          className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                            c.status === s
                              ? STATUS_STYLES[s] + ' shadow-sm'
                              : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-600'
                          }`}
                        >
                          {c.status === s && <CheckCircle2 size={12} />}
                          {s}
                        </button>
                      ))}
                    </div>
                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(c.id, c.name)}
                      className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 text-rose-500 bg-rose-50 border border-rose-200 hover:bg-rose-600 hover:text-white rounded-lg transition-colors"
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
