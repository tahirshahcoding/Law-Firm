'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, FolderOpen, Scale, Gavel, UserX, Clock, CheckCircle2, Zap, FileText, Lock, MessageCircle, ExternalLink, ShieldCheck } from 'lucide-react';
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh] border border-slate-200 dark:border-slate-800 transition-colors">
          
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/80 dark:bg-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <FolderOpen size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Case {caseData?.case_number || 'Details'}
                  </h2>
                  {caseData?.is_active === false ? (
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getClosureColor(caseData.closure_reason)}`}>
                      Closed — {caseData.closure_reason || 'N/A'}
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      Active Case
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {caseData?.client_name ? `${caseData.client_name} vs. ${caseData.opponent_name}` : `vs. ${caseData?.opponent_name}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link 
                href={`/cases/${caseId}`}
                onClick={onClose}
                className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Full Page View <ExternalLink size={13} />
              </Link>
              <button 
                onClick={onClose} 
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
            ) : !caseData ? (
              <div className="py-12 text-center text-slate-500">Case details unavailable.</div>
            ) : (
              <>
                {/* Analytics & Overview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40">
                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Current Stage</p>
                    <p className="text-base font-bold text-slate-900 dark:text-white mt-1 truncate">{caseData.status || 'Attendance'}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/40">
                    <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Total Hearings</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{hearings.length}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/40">
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Proceedings Done</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{completedCount}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/40">
                    <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Pending Hearings</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{pendingCount}</p>
                  </div>
                </div>

                {/* Case Metadata Bar */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 font-semibold block">Court & Judge:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                      {caseData.court_details?.name || '---'} ({caseData.court_details?.judge || '---'})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 font-semibold block">Client & Opponent:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                      {caseData.client_name || 'Client'} vs {caseData.opponent_name}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 font-semibold block">Financials & Fee:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                      PKR {Number(caseData.total_fee || 0).toLocaleString()} Total Fee
                    </span>
                  </div>
                </div>

                {/* Section: Hearings Log History & Workflow */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Clock size={16} className="text-blue-600 dark:text-blue-400" />
                      Hearings History & Proceeding Logs ({hearings.length})
                    </h3>
                  </div>

                  {hearings.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 text-xs">
                      No hearings scheduled for this case yet.
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 overflow-hidden divide-y divide-slate-100 dark:divide-slate-700/60 shadow-xs">
                      {hearings.map((h: any) => {
                        const isToday = h.hearing_date === new Date().toISOString().split('T')[0];
                        return (
                          <div key={h.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-700/40 transition-colors">
                            <div className="flex items-start gap-3">
                              <div className={`p-2.5 rounded-xl border shrink-0 mt-0.5 ${isToday ? 'bg-rose-100 dark:bg-rose-900/40 border-rose-200 text-rose-600' : 'bg-slate-100 dark:bg-slate-700 border-slate-200 text-slate-500'}`}>
                                <Calendar size={16} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-sm text-slate-900 dark:text-white font-mono">{formatDate(h.hearing_date)}</span>
                                  {isToday && <span className="text-[10px] uppercase font-bold text-rose-500">Today</span>}
                                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                    Stage: {h.hearing_stage}
                                  </span>
                                </div>
                                {h.notes && (
                                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 bg-slate-50 dark:bg-slate-900/40 p-2 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                                    {h.notes}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                              {h.is_completed ? (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-xs">
                                  <CheckCircle2 size={13} /> Proceeding Logged
                                </span>
                              ) : (
                                <button
                                  onClick={() => setSelectedLogHearing(h)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm hover:shadow transition-all"
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

                {/* Section: Non-editable Audit Timeline */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400" />
                    Case Activity Audit History ({timeline.length})
                  </h3>

                  <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                    {timeline.length === 0 ? (
                      <p className="text-xs text-slate-500">No activity recorded yet.</p>
                    ) : (
                      timeline.map((item: any) => (
                        <div key={item.id} className="flex items-start gap-3 text-xs">
                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                          <div>
                            <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">
                              {new Date(item.created_at).toLocaleDateString('en-GB')} — {item.created_by_name || 'System'}:
                            </span>
                            <span className="text-slate-600 dark:text-slate-400 ml-1.5">{item.description}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-800/50 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs transition-colors"
            >
              Close Window
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
