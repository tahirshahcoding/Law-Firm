'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { API_BASE, apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';
import { ArrowLeft, Clock, FileText, Banknote, Edit3, MessageCircle, RefreshCw, FolderOpen, UserX, Scale, Gavel, Calendar, CheckCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { getStatusColor } from '@/lib/constants';
import StatusDropdown from '@/components/StatusDropdown';

export default function CaseDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  
  const [caseData, setCaseData] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useUI();
  
  const isAuthorizedToNote = user?.role === 'Admin' || (caseData && caseData.assigned_to === user?.id);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [caseRes, timelineRes] = await Promise.all([
        apiFetch(`${API_BASE}/cases/${id}/`),
        apiFetch(`${API_BASE}/case-timelines/?case=${id}`)
      ]);
      
      if (!caseRes.ok) throw new Error("Failed to fetch case data");
      
      const cData = await caseRes.json();
      const tData = await timelineRes.json();
      
      setCaseData(cData);
      setTimeline(Array.isArray(tData) ? tData : (tData.results || []));
    } catch (err) {
      console.error(err);
      toast.error('Could not load case details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const handlePostNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    
    setSubmittingNote(true);
    try {
      const res = await apiFetch(`${API_BASE}/case-timelines/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case: id,
          description: noteText,
        })
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to post note');
      }
      setNoteText('');
      toast.success('Note added to timeline');
      fetchData(); // reload timeline
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!caseData || caseData.status === newStatus) return;
    setUpdatingStatus(true);
    try {
      const res = await apiFetch(`${API_BASE}/cases/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update status');
      toast.success('Status updated successfully');
      fetchData(); // reload case data and timeline
    } catch (err) {
      console.error(err);
      toast.error('Could not update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="p-8 text-center text-slate-500">Case not found.</div>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'Hearing': return <Gavel size={18} className="text-purple-600" />;
      case 'Document': return <FileText size={18} className="text-emerald-600" />;
      case 'Payment': return <Banknote size={18} className="text-emerald-600" />;
      case 'Note': return <MessageCircle size={18} className="text-blue-600" />;
      case 'StatusChange': return <RefreshCw size={18} className="text-orange-600" />;
      default: return <CheckCircle size={18} className="text-slate-600" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'Hearing': return 'bg-purple-100 border-purple-200';
      case 'Document': return 'bg-emerald-100 border-emerald-200';
      case 'Payment': return 'bg-emerald-100 border-emerald-200';
      case 'Note': return 'bg-blue-100 border-blue-200';
      case 'StatusChange': return 'bg-orange-100 border-orange-200';
      default: return 'bg-slate-100 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto pb-12">
      
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/cases" className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-sm">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            Case {caseData.case_number}
            {caseData.priority === 'Urgent' && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 uppercase tracking-wider">Urgent</span>}
            {caseData.priority === 'High' && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 uppercase tracking-wider">High</span>}
          </h2>
          <p className="text-slate-500 mt-1">{caseData.client_name} vs {caseData.opponent_name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <FolderOpen size={18} className="text-blue-600" />
              Case Overview
            </h3>
            
            <div className="space-y-4">
              <div className="flex flex-col items-start gap-1">
                <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Status</span>
                <div className="flex items-center gap-2">
                  <StatusDropdown 
                    value={caseData.status} 
                    onChange={handleStatusChange} 
                    disabled={updatingStatus || !isAuthorizedToNote}
                  />
                  {updatingStatus && <span className="text-xs text-slate-400">Saving...</span>}
                </div>
              </div>
              
              <div>
                <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Category</span>
                <span className="text-sm font-medium text-slate-900">{caseData.category || 'N/A'}</span>
              </div>
              
              <div className="pt-3 border-t border-slate-100">
                <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Court & Judge</span>
                <div className="flex items-center gap-2 text-sm text-slate-800 mb-1">
                  <Scale size={14} className="text-slate-400" /> {caseData.court_details?.name || '---'}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-800">
                  <Gavel size={14} className="text-slate-400" /> {caseData.court_details?.judge || '---'}
                </div>
              </div>
              
              <div className="pt-3 border-t border-slate-100">
                <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Client Details</span>
                <div className="text-sm font-medium text-slate-900">{caseData.client_name}</div>
                <div className="text-sm text-slate-500">{caseData.client_mobile || 'No contact info'}</div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Total Fee</span>
                <div className="text-sm font-semibold text-emerald-600">Rs {Number(caseData.total_fee).toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Timeline */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[700px]">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Clock size={18} className="text-blue-600" />
                Case Timeline
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 relative custom-scrollbar">
              <div className="absolute left-[39px] top-6 bottom-6 w-0.5 bg-slate-100"></div>
              
              <div className="space-y-6">
                {timeline.map((item, index) => (
                  <div key={item.id} className="relative flex gap-4 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}>
                    <div className={`w-10 h-10 shrink-0 rounded-full border-2 flex items-center justify-center z-10 bg-white ${getActivityColor(item.activity_type)}`}>
                      {getActivityIcon(item.activity_type)}
                    </div>
                    <div className="flex-1 pt-1.5">
                      <div className="flex items-center justify-between gap-4 mb-1">
                        <span className="font-semibold text-sm text-slate-900">
                          {item.activity_type === 'StatusChange' ? 'Status Update' : item.activity_type}
                        </span>
                        <span className="text-xs text-slate-400 whitespace-nowrap">
                          {new Date(item.timestamp).toLocaleString('en-GB', { 
                            day: 'numeric', month: 'short', year: 'numeric', 
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-sm text-slate-700">
                        {item.description}
                      </div>
                      <div className="mt-2 text-xs font-medium text-slate-400">
                        By {item.actor_name || 'System'}
                      </div>
                    </div>
                  </div>
                ))}

                {timeline.length === 0 && (
                  <div className="text-center text-slate-500 py-10">
                    No timeline events yet.
                  </div>
                )}
              </div>
            </div>

            {/* Note Input */}
            {isAuthorizedToNote ? (
              <div className="p-4 border-t border-slate-100 bg-white shrink-0">
                <form onSubmit={handlePostNote} className="relative">
                  <input
                    type="text"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add a manual note to the timeline..."
                    className="w-full pl-4 pr-24 py-3 bg-slate-50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={!noteText.trim() || submittingNote}
                    className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 duration-300 shadow-[0_4px_12px_rgba(37,99,235,0.25)] hover:shadow-[0_6px_16px_rgba(37,99,235,0.35)] hover:-translate-y-0.5 rounded-lg text-sm font-medium disabled:opacity-50 text-white"
                  >
                    {submittingNote ? 'Posting...' : 'Post'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <AlertTriangle size={14} className="text-amber-500" />
                Only the Assigned Advocate or Admin can add manual notes to the timeline.
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
