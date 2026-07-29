'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, AlignLeft, CheckCircle2, ArrowRight, Lock, MessageSquare, Sparkles, Clock, Zap, FileCheck, Scale, FileText, AlertCircle } from 'lucide-react';
import { API_BASE, apiFetch, safeJson } from '@/lib/api';
import { useUI } from '@/context/UIContext';
import { CASE_STATUSES, CLOSURE_REASONS, getClosureColor, getSuggestedNextStage } from '@/lib/constants';
import { sendWhatsApp, hearingScheduledMessage } from '@/lib/whatsapp';

interface LogProceedingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  hearing: any;
}

const SMART_TEMPLATES = [
  { label: '⚡ Adjourned for W/R/S', text: 'Matter adjourned for submission of Written Statement by respondent.' },
  { label: '⚡ Evidence Recorded', text: 'Evidence of plaintiff recorded. Case adjourned for further proceedings.' },
  { label: '⚡ Cross Examination', text: 'Witness cross-examined by defense counsel. Adjourned for remaining evidence.' },
  { label: '⚡ Arguments Heard', text: 'Arguments heard from both counsels. Case adjourned for final orders.' },
  { label: '⚡ Judgment Reserved', text: 'Final arguments completed. Judgment reserved by court.' },
  { label: '⚡ Defendant Absent', text: 'Defendant/Respondent absent despite service of notice. Adjourned.' },
  { label: '⚡ Plaintiff Absent', text: 'Plaintiff absent. Notice issued for personal appearance.' },
  { label: '⚡ Summons Issued', text: 'Summons issued to witnesses for next hearing date.' },
  { label: '⚡ Notice Served', text: 'Notice served upon respondent. File put up for appearance.' },
];

export default function LogProceedingModal({ isOpen, onClose, onSuccess, hearing }: LogProceedingModalProps) {
  const { toast, showLoading, hideLoading } = useUI();

  const [isAdjourned, setIsAdjourned] = useState<boolean>(true);
  const [nextDate, setNextDate] = useState('');
  const [nextStage, setNextStage] = useState('');
  const [notes, setNotes] = useState('');
  const [closeCase, setCloseCase] = useState(false);

  // Soft close fields (Improvement 11)
  const [closureReason, setClosureReason] = useState('Disposed');
  const [closureDate, setClosureDate] = useState('');
  const [certifiedCopyReceived, setCertifiedCopyReceived] = useState(false);
  const [executionRequired, setExecutionRequired] = useState(false);
  const [appealExpected, setAppealExpected] = useState(false);

  const suggestedStage = getSuggestedNextStage(hearing?.hearing_stage || hearing?.case_status || 'Attendance');

  useEffect(() => {
    if (hearing) {
      const currentStage = hearing.hearing_stage || hearing.case_status || 'Attendance';
      setNextStage(currentStage);
      setIsAdjourned(true);
      setNextDate('');
      setNotes('');
      setCloseCase(false);
      setClosureReason('Disposed');
      setClosureDate(new Date().toISOString().split('T')[0]);
      setCertifiedCopyReceived(false);
      setExecutionRequired(false);
      setAppealExpected(false);
    }
  }, [hearing]);

  if (!isOpen || !hearing) return null;

  // Calculate delay in days (Improvement 6)
  const calculateDaysInterval = () => {
    if (!nextDate || !hearing.hearing_date) return null;
    const current = new Date(hearing.hearing_date).getTime();
    const next = new Date(nextDate).getTime();
    const diffTime = next - current;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : null;
  };

  const daysInterval = calculateDaysInterval();

  // Quick Preset Actions (Improvement 7)
  const applyPresetRoutineAdjournment = () => {
    setIsAdjourned(true);
    setCloseCase(false);
    setNotes(prev => prev || 'Adjourned on request of counsel.');
  };

  const applyPresetAdvanceStage = () => {
    setIsAdjourned(true);
    setCloseCase(false);
    setNextStage(suggestedStage);
    toast.success(`Stage set to: ${suggestedStage}`);
  };

  const applyPresetJudgmentReserved = () => {
    setIsAdjourned(false);
    setCloseCase(false);
    setNextStage('Order');
    setNotes('Final arguments concluded. Judgment reserved by court.');
  };

  const insertTemplateText = (templateText: string) => {
    setNotes(prev => (prev ? `${prev}\n${templateText}` : templateText));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!closeCase && isAdjourned && !nextDate) {
      toast.error('Please enter the Next Hearing Date when Case is Adjourned.');
      return;
    }

    try {
      showLoading('Logging court proceeding...');

      const payload = {
        notes,
        next_date: (isAdjourned && nextDate) ? nextDate : null,
        next_stage: nextStage,
        close_case: closeCase,
        closure_reason: closeCase ? closureReason : '',
        closure_date: closeCase ? closureDate : null,
        certified_copy_received: closeCase ? certifiedCopyReceived : false,
        execution_required: closeCase ? executionRequired : false,
        appeal_expected: closeCase ? appealExpected : false,
      };

      const res = await apiFetch(`${API_BASE}/hearings/${hearing.id}/log_proceeding/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error(data.error || data.detail || 'Failed to log proceeding');
      }

      toast.success('Proceeding logged successfully!');

      if (isAdjourned && nextDate && hearing.client_number) {
        const message = hearingScheduledMessage(
          hearing.client_name || 'Client',
          hearing.case_number || 'Case',
          nextDate,
          undefined,
          notes || undefined
        );
        sendWhatsApp(hearing.client_number, message);
        toast.success('WhatsApp opened with next date for client!');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Could not log proceeding');
    } finally {
      hideLoading();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh] border border-slate-100 dark:border-slate-800 transition-colors">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-800/40">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <Zap size={14} className="fill-current" /> Log Court Proceeding
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              Case {hearing.case_number || 'Update'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 custom-scrollbar">

          {/* Improvement 5 — Previous Proceeding Always Visible Context */}
          <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-800/60 dark:to-slate-800/20 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                <Clock size={13} /> Current Hearing Context
              </span>
              <span className="font-mono text-slate-700 dark:text-slate-300">{hearing.hearing_date}</span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {hearing.client_name ? `${hearing.client_name} vs. ${hearing.opponent_name}` : `Hearing on ${hearing.hearing_date}`}
              </p>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                {hearing.hearing_stage || 'Attendance'}
              </span>
            </div>
            {hearing.notes && (
              <p className="text-xs text-slate-600 dark:text-slate-400 italic bg-white/80 dark:bg-slate-900/80 p-2 rounded-xl border border-slate-200/60 dark:border-slate-700/60 mt-1 line-clamp-2">
                "{hearing.notes}"
              </p>
            )}
          </div>

          {/* Improvement 7 — 1-Click Quick Preset Actions */}
          <div>
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">1-Click Quick Action Presets</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={applyPresetRoutineAdjournment}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all text-center"
              >
                ⚡ Routine Adjourn
              </button>
              <button
                type="button"
                onClick={applyPresetAdvanceStage}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition-all text-center"
              >
                ⚡ Advance Stage
              </button>
              <button
                type="button"
                onClick={applyPresetJudgmentReserved}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 transition-all text-center"
              >
                ⚡ Reserved Order
              </button>
              <button
                type="button"
                onClick={() => { setCloseCase(true); setIsAdjourned(false); }}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-all text-center"
              >
                ⚡ Soft Close Case
              </button>
            </div>
          </div>

          {/* Action Choice: Adjourned vs Concluded vs Closed */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Case Status Outcome</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Choose if case continues to a next date or is finished.</p>
              </div>
              <div className="flex gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => { setCloseCase(false); setIsAdjourned(true); }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    !closeCase && isAdjourned ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Adjourned
                </button>
                <button
                  type="button"
                  onClick={() => { setCloseCase(false); setIsAdjourned(false); setNextDate(''); }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    !closeCase && !isAdjourned ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  No Next Date
                </button>
                <button
                  type="button"
                  onClick={() => { setCloseCase(true); setIsAdjourned(false); setNextDate(''); }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    closeCase ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Close Case
                </button>
              </div>
            </div>

            {/* Improvement 3 — Auto Suggest Next Stage Banner */}
            {!closeCase && suggestedStage !== (hearing.hearing_stage || hearing.case_status) && (
              <div className="flex items-center justify-between p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-800 text-xs">
                <span className="font-medium text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-blue-600 shrink-0" />
                  Suggested Next Stage: <strong>{suggestedStage}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setNextStage(suggestedStage)}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all text-[11px]"
                >
                  Accept Stage
                </button>
              </div>
            )}
          </div>

          {/* Adjournment & Next Date Settings */}
          {!closeCase && isAdjourned && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Next Hearing Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={nextDate}
                  onChange={(e) => setNextDate(e.target.value)}
                  min={hearing.hearing_date}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono text-slate-900 dark:text-white shadow-sm"
                />
                {/* Improvement 6 — Days Interval Calculator */}
                {daysInterval && (
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                    ⚡ Adjourned for {daysInterval} days
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Case Stage
                </label>
                <select
                  value={nextStage}
                  onChange={(e) => setNextStage(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-white shadow-sm"
                >
                  {CASE_STATUSES.map(stage => (
                    <option key={stage} value={stage}>{stage}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Improvement 11 — Soft Close Case Extended Context */}
          {closeCase && (
            <div className="space-y-4 p-4 bg-rose-50/50 dark:bg-rose-900/20 rounded-2xl border border-rose-200 dark:border-rose-800/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Closure Outcome</label>
                  <select
                    value={closureReason}
                    onChange={(e) => setClosureReason(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                  >
                    {CLOSURE_REASONS.map(reason => (
                      <option key={reason} value={reason}>{reason}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Closure Date</label>
                  <input
                    type="date"
                    value={closureDate}
                    onChange={(e) => setClosureDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-rose-200/60 dark:border-rose-800/40 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <label className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={certifiedCopyReceived}
                    onChange={(e) => setCertifiedCopyReceived(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-medium text-slate-700 dark:text-slate-300">Certified Copy Recd?</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={executionRequired}
                    onChange={(e) => setExecutionRequired(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-medium text-slate-700 dark:text-slate-300">Execution Req?</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={appealExpected}
                    onChange={(e) => setAppealExpected(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-medium text-slate-700 dark:text-slate-300">Appeal Expected?</span>
                </label>
              </div>
            </div>
          )}

          {/* Improvement 4 — Smart Proceeding Templates */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Court Proceedings Notes
              </label>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">Click a template below to auto-insert</span>
            </div>

            {/* Template Chips */}
            <div className="flex flex-wrap gap-1.5 mb-2 max-h-24 overflow-y-auto custom-scrollbar p-1 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              {SMART_TEMPLATES.map(tmpl => (
                <button
                  key={tmpl.label}
                  type="button"
                  onClick={() => insertTemplateText(tmpl.text)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/40 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all text-left shadow-2xs whitespace-nowrap"
                >
                  {tmpl.label}
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Evidence recorded. Adjourned for cross examination..."
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-white resize-none shadow-sm"
            ></textarea>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-6 py-2.5 rounded-xl font-bold text-white text-sm shadow-md transition-all flex items-center gap-2 ${
                closeCase
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg'
              }`}
            >
              <CheckCircle2 size={16} />
              {closeCase ? 'Complete & Close Case' : 'Save Court Proceeding'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
