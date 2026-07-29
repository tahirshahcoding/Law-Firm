'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, FolderOpen, Scale, Gavel, CheckCircle2, Zap, Clock, ExternalLink, ShieldCheck, UserX, User, DollarSign, Send, MessageSquare, AlertTriangle } from 'lucide-react';
import { API_BASE, apiFetch } from '@/lib/api';
import { useUI } from '@/context/UIContext';
import { useAuth } from '@/context/AuthContext';
import { getClosureColor, getStatusColor } from '@/lib/constants';
import StatusDropdown from '@/components/StatusDropdown';
import { formatCaseTitle } from '@/lib/formatters';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const LogProceedingModal = dynamic(() => import('@/components/LogProceedingModal'), { ssr: false });

interface CaseSplitPanelProps {
  caseId: string;
  onClose: () => void;
  onRefreshCases?: () => void;
}

export default function CaseSplitPanel({ caseId, onClose, onRefreshCases }: CaseSplitPanelProps) {
  const { toast } = useUI();
  const { user } = useAuth();

  const [caseData, setCaseData] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [hearings, setHearings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'workflow' | 'details' | 'audit'>('workflow');
  const [selectedLogHearing, setSelectedLogHearing] = useState<any>(null);
  const [noteText, setNoteText] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  const fetchCaseDetails = async () => {
    if (!caseId) return;
    try {
      setLoading(true);
      const [caseRes, timelineRes, hearingsRes] = await Promise.all([
        apiFetch(`${API_BASE}/cases/${caseId}/`),
        apiFetch(`${API_BASE}/case-timelines/?case=${caseId}`),
        apiFetch(`${API_BASE}/hearings/?case=${caseId}&limit=100`)
      ]);

      if (!caseRes.ok) throw new Error('Failed to fetch case data');

      const cData = await caseRes.json();
      const tData = await timelineRes.json();
      const hData = await hearingsRes.json();

      setCaseData(cData);
      setTimeline(Array.isArray(tData) ? tData : (tData.results || []));
      
      const rawHearings = Array.isArray(hData) ? hData : (hData.results || []);
      const sorted = [...rawHearings].sort((a: any, b: any) => new Date(b.hearing_date).getTime() - new Date(a.hearing_date).getTime());
      setHearings(sorted);
    } catch (err) {
      console.error(err);
      toast.error('Could not load case details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaseDetails();
    setActiveTab('workflow');
  }, [caseId]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await apiFetch(`${API_BASE}/cases/${caseId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        toast.success('Case stage updated');
        fetchCaseDetails();
        if (onRefreshCases) onRefreshCases();
      } else {
        toast.error('Failed to update stage');
      }
    } catch (err) {
      toast.error('Error updating stage');
    }
  };

  const handlePostNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    try {
      setSubmittingNote(true);
      const res = await apiFetch(`${API_BASE}/case-timelines/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case: caseId,
          activity_type: 'Note',
          description: noteText.trim()
        })
      });

      if (res.ok) {
        toast.success('Note added to timeline');
        setNoteText('');
        fetchCaseDetails();
      } else {
        toast.error('Failed to add note');
      }
    } catch (err) {
      toast.error('Could not add note');
    } finally {
      setSubmittingNote(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '---';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center justify-center min-h-[500px] shadow-sm">
        <div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 mt-3 font-medium">Loading case file...</p>
      </div>
    );
  }

  if (!caseData) return null;

  const completedCount = hearings.filter((h: any) => h.is_completed).length;
  const pendingCount = hearings.filter((h: any) => !h.is_completed).length;
  const latestPendingHearing = hearings.find((h: any) => !h.is_completed) || hearings[0];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-none overflow-hidden flex flex-col h-full min-h-[650px] transition-all animate-in fade-in slide-in-from-right-4 duration-300">
      
      {/* Panel Top Header Bar */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 shrink-0 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight truncate max-w-[300px] sm:max-w-[400px]" title={formatCaseTitle(caseData)}>
              {formatCaseTitle(caseData)}
            </h3>
            {caseData.priority && (
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                caseData.priority === 'Urgent' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                caseData.priority === 'High' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                {caseData.priority}
              </span>
            )}
            {caseData.is_active === false ? (
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getClosureColor(caseData.closure_reason)}`}>
                Closed — {caseData.closure_reason || 'Disposed'}
              </span>
            ) : (
              <StatusDropdown 
                value={caseData.status} 
                onChange={handleStatusChange} 
              />
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 mt-2">
            <span className="font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-1">
              <FolderOpen size={13} className="text-slate-400" /> Case {caseData.case_number}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Link 
            href={`/cases/${caseId}`}
            className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700 transition-colors shadow-xs"
            title="Open Full Page View"
          >
            <ExternalLink size={16} />
          </Link>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700 transition-colors shadow-xs"
            title="Close Panel"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="px-5 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0">
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('workflow')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'workflow' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            Hearings ({hearings.length})
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'details' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            Case Overview
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'audit' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            Timeline ({timeline.length})
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium hidden sm:block font-mono">
          Stage: <strong className="text-slate-900 dark:text-white">{caseData.status}</strong>
        </div>
      </div>

      {/* Main Panel Content Body */}
      <div className="p-5 overflow-y-auto flex-1 space-y-5 custom-scrollbar">
        
        {/* TAB 1: HEARINGS & PROCEEDINGS WORKFLOW */}
        {activeTab === 'workflow' && (
          <div className="space-y-5">
            
            {/* Quick Action Card: Latest Hearing */}
            {latestPendingHearing ? (
              <div className="bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-slate-50 dark:from-slate-800/70 dark:to-slate-800/40 border border-blue-200/80 dark:border-slate-700 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                      <Zap size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Next Actionable Hearing</h4>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{formatDate(latestPendingHearing.hearing_date)}</p>
                    </div>
                  </div>

                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                    Stage: {latestPendingHearing.hearing_stage}
                  </span>
                </div>

                {latestPendingHearing.notes && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 italic bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    "{latestPendingHearing.notes}"
                  </p>
                )}

                {caseData.is_active !== false && (
                  <button
                    onClick={() => setSelectedLogHearing(latestPendingHearing)}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm"
                  >
                    <Zap size={14} className="fill-white" /> Log Proceeding & Schedule Next
                  </button>
                )}
              </div>
            ) : null}

            {/* Hearings List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                <span>All Case Hearings ({hearings.length})</span>
                <span className="text-emerald-600 dark:text-emerald-400">{completedCount} Logged</span>
              </div>

              {hearings.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                  No hearings scheduled for this case yet.
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700/60 overflow-hidden">
                  {hearings.map((h: any) => (
                    <div key={h.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-700/40 transition-colors">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`p-2 rounded-xl border shrink-0 mt-0.5 ${h.is_completed ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 text-emerald-600' : 'bg-slate-100 dark:bg-slate-700 border-slate-200 text-slate-500'}`}>
                          <Calendar size={15} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-slate-900 dark:text-white font-mono">{formatDate(h.hearing_date)}</span>
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                              {h.hearing_stage}
                            </span>
                          </div>
                          {h.notes && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-xs">
                              {h.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0">
                        {h.is_completed ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 size={12} /> Logged
                          </span>
                        ) : (
                          <button
                            onClick={() => setSelectedLogHearing(h)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all"
                          >
                            <Zap size={13} /> Log
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 2: CASE OVERVIEW DETAILS */}
        {activeTab === 'details' && (
          <div className="space-y-4 text-xs">
            
            {/* Judiciary & Court Info */}
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
                <Scale size={15} className="text-blue-500" /> Judiciary Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-slate-400 font-medium block">Court Forum</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm mt-0.5 block">{caseData.court_details?.name || '---'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Presiding Judge</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm mt-0.5 block">{caseData.court_details?.judge || '---'}</span>
                </div>
              </div>
            </div>

            {/* Client & Opponent Info */}
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
                <User size={15} className="text-indigo-500" /> Parties Involved
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-slate-400 font-medium block">Client Name</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm mt-0.5 block">{caseData.client_name || 'Client'}</span>
                  <span className="text-slate-500 block mt-0.5">{caseData.client_mobile || 'No contact phone'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Opposing Party</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm mt-0.5 block">{caseData.opponent_name}</span>
                </div>
              </div>
            </div>

            {/* Financial & Category */}
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
                <DollarSign size={15} className="text-emerald-500" /> Financial & Category
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-slate-400 font-medium block">Case Category</span>
                  <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">{caseData.category || 'General Civil'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Total Agreed Fee</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5 block">PKR {Number(caseData.total_fee || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: TIMELINE & AUDIT LOG */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            
            {/* Timeline Stream */}
            <div className="space-y-2.5">
              {timeline.length === 0 ? (
                <p className="text-xs text-slate-500 p-6 text-center bg-slate-50 rounded-xl">No timeline events logged.</p>
              ) : (
                timeline.map((item: any) => (
                  <div key={item.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 text-xs">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{item.created_by_name || 'System Audit'}</span>
                      <span className="font-mono text-[11px]">{new Date(item.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{item.description}</p>
                  </div>
                ))
              )}
            </div>

            {/* Note Input Box */}
            <form onSubmit={handlePostNote} className="pt-2">
              <div className="relative">
                <input
                  type="text"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add a quick note to case file timeline..."
                  className="w-full pl-4 pr-20 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all shadow-xs"
                />
                <button
                  type="submit"
                  disabled={!noteText.trim() || submittingNote}
                  className="absolute right-1 top-1 bottom-1 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition-all flex items-center gap-1"
                >
                  <Send size={12} /> Add
                </button>
              </div>
            </form>

          </div>
        )}

      </div>

      {/* Log Proceeding Modal integration */}
      {selectedLogHearing && (
        <LogProceedingModal
          isOpen={!!selectedLogHearing}
          onClose={() => setSelectedLogHearing(null)}
          onSuccess={() => {
            fetchCaseDetails();
            if (onRefreshCases) onRefreshCases();
          }}
          hearing={selectedLogHearing}
        />
      )}
    </div>
  );
}
