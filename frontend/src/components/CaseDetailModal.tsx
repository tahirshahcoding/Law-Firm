'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, FolderOpen, Scale, Gavel, CheckCircle2, Zap, Clock, ExternalLink, ShieldCheck } from 'lucide-react';
import { API_BASE, apiFetch } from '@/lib/api';
import { useUI } from '@/context/UIContext';
import { getClosureColor } from '@/lib/constants';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const LogProceedingModal = dynamic(() => import('@/components/LogProceedingModal'), { ssr: false });

interface CaseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string | null;
}

export default function CaseDetailModal({ isOpen, onClose, caseId }: CaseDetailModalProps) {
  const { toast } = useUI();

  const [caseData, setCaseData] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [hearings, setHearings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'hearings' | 'overview' | 'audit'>('hearings');
  const [selectedLogHearing, setSelectedLogHearing] = useState<any>(null);

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
    if (isOpen && caseId) {
      fetchCaseDetails();
      setActiveTab('hearings');
    } else {
      setCaseData(null);
      setTimeline([]);
      setHearings([]);
    }
  }, [isOpen, caseId]);

  if (!isOpen || !caseId) return null;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '---';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const completedCount = hearings.filter((h: any) => h.is_completed).length;
  const pendingCount = hearings.filter((h: any) => !h.is_completed).length;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-800 transition-colors">
          
          {/* Minimal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/60 dark:bg-slate-800/60">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Case {caseData?.case_number || 'Details'}
                </h2>
                {caseData?.is_active === false ? (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getClosureColor(caseData.closure_reason)}`}>
                    Closed — {caseData.closure_reason || 'Disposed'}
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {caseData?.client_name ? `${caseData.client_name} vs. ${caseData.opponent_name}` : `vs. ${caseData?.opponent_name}`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link 
                href={`/cases/${caseId}`}
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Open Full Page View"
              >
                <ExternalLink size={17} />
              </Link>
              <button 
                type="button"
                onClick={onClose} 
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Sub Header Navigation Tabs */}
          <div className="px-6 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0">
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setActiveTab('hearings')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'hearings' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Hearings ({hearings.length})
              </button>
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'overview' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Overview & Court
              </button>
              <button
                onClick={() => setActiveTab('audit')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'audit' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Audit Log ({timeline.length})
              </button>
            </div>

            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:inline-block">
              Stage: <strong className="text-slate-800 dark:text-slate-200">{caseData?.status || 'Attendance'}</strong>
            </span>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-7 h-7 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
            ) : !caseData ? (
              <div className="py-12 text-center text-xs text-slate-500">Case details unavailable.</div>
            ) : (
              <>
                {/* TAB 1: HEARINGS HISTORY & LOGS */}
                {activeTab === 'hearings' && (
                  <div className="space-y-4">
                    {/* Metrics Pill Row */}
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Hearings</span>
                        <span className="text-lg font-bold text-slate-900 dark:text-white font-mono mt-0.5 block">{hearings.length}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/40">
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Logged</span>
                        <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300 font-mono mt-0.5 block">{completedCount}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/40">
                        <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Pending</span>
                        <span className="text-lg font-bold text-amber-700 dark:text-amber-300 font-mono mt-0.5 block">{pendingCount}</span>
                      </div>
                    </div>

                    {hearings.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                        No hearings scheduled for this case yet.
                      </div>
                    ) : (
                      <div className="bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden divide-y divide-slate-100 dark:divide-slate-700/60">
                        {hearings.map((h: any) => {
                          const isToday = h.hearing_date === new Date().toISOString().split('T')[0];
                          return (
                            <div key={h.id} className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors">
                              <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg border shrink-0 mt-0.5 ${isToday ? 'bg-rose-100 dark:bg-rose-900/40 border-rose-200 text-rose-600' : 'bg-slate-100 dark:bg-slate-700 border-slate-200 text-slate-500'}`}>
                                  <Calendar size={15} />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-sm text-slate-900 dark:text-white font-mono">{formatDate(h.hearing_date)}</span>
                                    {isToday && <span className="text-[10px] uppercase font-bold text-rose-500">Today</span>}
                                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                                      Stage: {h.hearing_stage}
                                    </span>
                                  </div>
                                  {h.notes && (
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                                      {h.notes}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="self-end sm:self-center shrink-0">
                                {h.is_completed ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                    <CheckCircle2 size={12} /> Logged
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => setSelectedLogHearing(h)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xs transition-all"
                                  >
                                    <Zap size={13} className="fill-white" /> Log Proceeding
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: OVERVIEW & COURT DETAILS */}
                {activeTab === 'overview' && (
                  <div className="space-y-4 text-xs">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <span className="text-slate-400 font-semibold uppercase block text-[10px]">Court Name</span>
                          <span className="font-bold text-slate-900 dark:text-white text-sm mt-0.5 block">{caseData.court_details?.name || '---'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold uppercase block text-[10px]">Presiding Judge</span>
                          <span className="font-bold text-slate-900 dark:text-white text-sm mt-0.5 block">{caseData.court_details?.judge || '---'}</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-200/60 dark:border-slate-700/60 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <span className="text-slate-400 font-semibold uppercase block text-[10px]">Client</span>
                          <span className="font-bold text-slate-900 dark:text-white text-sm mt-0.5 block">{caseData.client_name || 'Client'}</span>
                          <span className="text-slate-500 block">{caseData.client_mobile || 'No contact'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold uppercase block text-[10px]">Opponent Party</span>
                          <span className="font-bold text-slate-900 dark:text-white text-sm mt-0.5 block">{caseData.opponent_name}</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-200/60 dark:border-slate-700/60 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <span className="text-slate-400 font-semibold uppercase block text-[10px]">Category & Priority</span>
                          <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">{caseData.category || 'General'} ({caseData.priority || 'Medium'})</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold uppercase block text-[10px]">Total Agreed Fee</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5 block">PKR {Number(caseData.total_fee || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: AUDIT LOG */}
                {activeTab === 'audit' && (
                  <div className="space-y-3">
                    {timeline.length === 0 ? (
                      <p className="text-xs text-slate-500 p-4 text-center">No activity logged in timeline.</p>
                    ) : (
                      <div className="space-y-2 text-xs">
                        {timeline.map((item: any) => (
                          <div key={item.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-start gap-2.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between text-slate-400 text-[11px] mb-0.5">
                                <span className="font-bold text-slate-700 dark:text-slate-300">{item.created_by_name || 'System'}</span>
                                <span className="font-mono">{new Date(item.created_at).toLocaleDateString('en-GB')}</span>
                              </div>
                              <p className="text-slate-700 dark:text-slate-300">{item.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Minimal Footer */}
          <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-800/50 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs transition-colors"
            >
              Close
            </button>
          </div>

        </div>
      </div>

      {/* Log Proceeding Modal integration */}
      {selectedLogHearing && (
        <LogProceedingModal
          isOpen={!!selectedLogHearing}
          onClose={() => setSelectedLogHearing(null)}
          onSuccess={() => {
            fetchCaseDetails();
          }}
          hearing={selectedLogHearing}
        />
      )}
    </>
  );
}
