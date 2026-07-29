'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, AlignLeft, CheckCircle2, ArrowRight, Lock, MessageSquare } from 'lucide-react';
import { API_BASE, apiFetch, safeJson } from '@/lib/api';
import { useUI } from '@/context/UIContext';
import { CASE_STATUSES, CLOSURE_REASONS, getClosureColor } from '@/lib/constants';
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
  const [closureReason, setClosureReason] = useState('Won');

  useEffect(() => {
    if (hearing) {
      setNextStage(hearing.hearing_stage || hearing.case_status || 'Attendance');
      setNextDate('');
      setNotes('');
      setCloseCase(false);
      setClosureReason('Won');
    }
  }, [hearing]);

  if (!isOpen || !hearing) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!closeCase && !nextDate) {
      toast.error('Please enter the Next Hearing Date or select Close Case.');
      return;
    }

    try {
      showLoading('Logging proceeding & updating case...');

      const payload = {
        notes,
        next_date: nextDate || null,
        next_stage: nextStage,
        close_case: closeCase,
        closure_reason: closeCase ? closureReason : '',
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

      // WhatsApp Prompt to client if next date set
      if (nextDate && hearing.client_number) {
        const message = hearingScheduledMessage(
          hearing.client_name || 'Client',
          hearing.case_number || 'Case',
          nextDate,
          undefined,
          notes || undefined
        );
        sendWhatsApp(hearing.client_number, message);
        toast.success('WhatsApp opened with next hearing update for client!');
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] transition-colors">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">Log Proceeding</span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {hearing.case_number || 'Hearing Update'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {hearing.client_name ? `${hearing.client_name} vs. ${hearing.opponent_name}` : `Hearing on ${hearing.hearing_date}`}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
          
          {/* Action Choice: Continue vs Final Disposition */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Did this case reach final order/disposition?</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Mark as Closed if no further hearings are required.</p>
            </div>
            <button
              type="button"
              onClick={() => setCloseCase(!closeCase)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                closeCase
                  ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                  : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600 hover:bg-slate-100'
              }`}
            >
              {closeCase ? 'Closing Case' : 'Case Continuing'}
            </button>
          </div>

          {!closeCase ? (
            <>
              {/* Next Hearing Date & Stage */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Next Hearing Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required={!closeCase}
                    value={nextDate}
                    onChange={(e) => setNextDate(e.target.value)}
                    min={hearing.hearing_date}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Next Stage
                  </label>
                  <select
                    value={nextStage}
                    onChange={(e) => setNextStage(e.target.value)}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-white"
                  >
                    {CASE_STATUSES.map(stage => (
                      <option key={stage} value={stage}>{stage}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          ) : (
            /* Closure Reasons */
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Select Closure Reason</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CLOSURE_REASONS.map(reason => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setClosureReason(reason)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                      closureReason === reason
                        ? `${getClosureColor(reason)} ring-2 ring-blue-500/30`
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Proceeding Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Court Proceedings Summary / Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Written statement submitted by respondent. Adjourned for framing of issues..."
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-white resize-none"
            ></textarea>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-6 py-2 rounded-lg font-medium text-white text-sm shadow-md transition-all flex items-center gap-2 ${
                closeCase
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
              }`}
            >
              <CheckCircle2 size={16} />
              {closeCase ? 'Complete & Close Case' : 'Log & Schedule Next Hearing'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
