'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, CheckCircle2, Clock, FolderOpen, Zap } from 'lucide-react';
import { API_BASE, apiFetch, safeJson } from '@/lib/api';
import { useUI } from '@/context/UIContext';
import { CASE_STATUSES, CLOSURE_REASONS } from '@/lib/constants';
import { sendWhatsApp, hearingScheduledMessage } from '@/lib/whatsapp';

interface LogProceedingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  hearing: any;
}

export default function LogProceedingModal({ isOpen, onClose, onSuccess, hearing }: LogProceedingModalProps) {
  const { toast, showLoading, hideLoading } = useUI();

  const [nextDate, setNextDate] = useState('');
  const [nextStage, setNextStage] = useState('');
  const [notes, setNotes] = useState('');
  const [closeCase, setCloseCase] = useState(false);

  // Soft close fields
  const [closureReason, setClosureReason] = useState('Disposed');
  const [closureDate, setClosureDate] = useState('');
  const [certifiedCopyReceived, setCertifiedCopyReceived] = useState(false);
  const [executionRequired, setExecutionRequired] = useState(false);
  const [appealExpected, setAppealExpected] = useState(false);

  useEffect(() => {
    if (hearing) {
      const currentStage = hearing.hearing_stage || hearing.case_status || 'Attendance';
      setNextStage(currentStage);
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

  // Calculate interval in days if next date selected
  const calculateDaysInterval = () => {
    if (!nextDate || !hearing.hearing_date) return null;
    const current = new Date(hearing.hearing_date).getTime();
    const next = new Date(nextDate).getTime();
    const diffDays = Math.ceil((next - current) / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : null;
  };

  const daysInterval = calculateDaysInterval();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      showLoading('Logging proceeding...');

      const payload = {
        notes,
        next_date: nextDate || null,
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

      if (nextDate && hearing.client_number) {
        const message = hearingScheduledMessage(
          hearing.client_name || 'Client',
          hearing.case_number || 'Case',
          nextDate,
          undefined,
          notes || undefined
        );
        sendWhatsApp(hearing.client_number, message);
        toast.success('WhatsApp notification prepared for client.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-800 transition-colors">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-800/50">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Log Proceeding</span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              Case {hearing.case_number || 'Update'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {hearing.client_name ? `${hearing.client_name} vs. ${hearing.opponent_name}` : `Hearing on ${hearing.hearing_date}`}
            </p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 custom-scrollbar">

          {/* Current Hearing Context Pill */}
          <div className="p-3 bg-blue-50/60 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/40 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
              <Calendar size={14} className="text-blue-600 dark:text-blue-400" />
              <span>Hearing Date: <strong className="font-mono text-slate-900 dark:text-white">{hearing.hearing_date}</strong></span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full font-semibold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-[11px]">
              Stage: {hearing.hearing_stage || 'Attendance'}
            </span>
          </div>

          {/* Next Hearing Date (Optional) & Next Stage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Next Hearing Date <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="date"
                value={nextDate}
                onChange={(e) => setNextDate(e.target.value)}
                min={hearing.hearing_date}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-white shadow-xs"
              />
              {daysInterval && (
                <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                  Adjourned for {daysInterval} days
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Case Stage
              </label>
              <select
                value={nextStage}
                onChange={(e) => setNextStage(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-white shadow-xs"
              >
                {CASE_STATUSES.map(stage => (
                  <option key={stage} value={stage}>{stage}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Court Proceedings Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Court Proceedings Summary / Notes
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter details of court order or proceeding notes..."
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-white resize-none shadow-xs"
            ></textarea>
          </div>

          {/* Close Case Section */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={closeCase}
                onChange={(e) => setCloseCase(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Mark Case as Closed / Disposed
              </span>
            </label>

            {closeCase && (
              <div className="p-3.5 bg-rose-50/50 dark:bg-rose-900/20 rounded-xl border border-rose-200 dark:border-rose-800/50 space-y-3 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Outcome Reason</label>
                    <select
                      value={closureReason}
                      onChange={(e) => setClosureReason(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white"
                    >
                      {CLOSURE_REASONS.map(reason => (
                        <option key={reason} value={reason}>{reason}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Closure Date</label>
                    <input
                      type="date"
                      value={closureDate}
                      onChange={(e) => setClosureDate(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-rose-200/60 dark:border-rose-800/40 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={certifiedCopyReceived}
                      onChange={(e) => setCertifiedCopyReceived(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">Certified Copy Recd</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={executionRequired}
                      onChange={(e) => setExecutionRequired(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">Execution Req</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={appealExpected}
                      onChange={(e) => setAppealExpected(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">Appeal Expected</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2 rounded-lg font-bold text-white text-xs shadow-md transition-all flex items-center gap-1.5 ${
                closeCase
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
              }`}
            >
              <CheckCircle2 size={15} />
              {closeCase ? 'Complete & Close Case' : 'Save Proceeding'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
