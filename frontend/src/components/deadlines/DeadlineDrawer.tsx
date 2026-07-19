'use client';

import { X, Calendar, User, AlignLeft, CheckCircle, FileText, Activity, AlertCircle, AlertTriangle, Trash2, Edit2 } from 'lucide-react';
import { API_BASE, apiFetch } from '@/lib/api';
import { useUI } from '@/context/UIContext';
import { useState } from 'react';

interface DeadlineDrawerProps {
  deadline: any;
  onClose: () => void;
  onUpdate: () => void;
  onEdit: (deadline: any) => void;
}

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function DeadlineDrawer({ deadline, onClose, onUpdate, onEdit }: DeadlineDrawerProps) {
  const { toast, showLoading, hideLoading } = useUI();
  const [isDeleting, setIsDeleting] = useState(false);
  
  if (!deadline) return null;

  const handleMarkCompleted = async () => {
    showLoading('Marking as completed...');
    try {
      const res = await apiFetch(`${API_BASE}/deadlines/${deadline.id}/mark_completed/`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to update status');
      toast.success('Deadline marked as completed');
      onUpdate();
    } catch (err: any) {
      toast.error(err.message || 'Error updating status');
    } finally {
      hideLoading();
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this deadline?')) return;
    setIsDeleting(true);
    showLoading('Deleting...');
    try {
      const res = await apiFetch(`${API_BASE}/deadlines/${deadline.id}/`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete deadline');
      toast.success('Deadline deleted');
      onUpdate();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Error deleting deadline');
    } finally {
      hideLoading();
      setIsDeleting(false);
    }
  };

  const isCompleted = deadline.status === 'Completed';

  return (
    <>
      <div 
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isCompleted ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
              <Calendar size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 line-clamp-1">{deadline.title}</h2>
              <p className="text-xs text-slate-500 font-medium">{deadline.deadline_type}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status & Priority Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Status</p>
              <div className="flex items-center gap-2">
                {deadline.status === 'Completed' ? (
                  <><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="font-semibold text-slate-700">Completed</span></>
                ) : deadline.status === 'Pending' && new Date(deadline.due_date) < new Date(new Date().setHours(0,0,0,0)) ? (
                  <><div className="w-2 h-2 rounded-full bg-rose-500" /><span className="font-semibold text-rose-600">Overdue</span></>
                ) : (
                  <><div className="w-2 h-2 rounded-full bg-amber-500" /><span className="font-semibold text-slate-700">Pending</span></>
                )}
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Priority</p>
              <div className="flex items-center gap-2">
                {deadline.priority === 'High' && <div className="w-2 h-2 rounded-full bg-rose-500" />}
                {deadline.priority === 'Medium' && <div className="w-2 h-2 rounded-full bg-amber-500" />}
                {deadline.priority === 'Low' && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                <span className="font-semibold text-slate-700">{deadline.priority}</span>
              </div>
            </div>
          </div>

          {/* Details List */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
              <FileText size={16} className="text-slate-400" />
              <div>
                <p className="text-xs text-slate-500 font-medium">Related Case</p>
                <p className="text-sm font-semibold text-slate-800">
                  {deadline.case_number ? `${deadline.case_number} - ${deadline.client_name}` : 'Not Linked'}
                </p>
              </div>
            </div>
            
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
              <User size={16} className="text-slate-400" />
              <div>
                <p className="text-xs text-slate-500 font-medium">Assigned To</p>
                <p className="text-sm font-semibold text-slate-800">
                  {deadline.assigned_user_name || 'Unassigned'}
                </p>
              </div>
            </div>

            <div className="px-5 py-4 flex items-center gap-3">
              <Activity size={16} className="text-slate-400" />
              <div>
                <p className="text-xs text-slate-500 font-medium">Due Date</p>
                <p className="text-sm font-semibold text-slate-800">
                  {fmtDate(deadline.due_date)}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          {deadline.description && (
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <AlignLeft size={14} /> Description
              </h3>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {deadline.description}
              </div>
            </div>
          )}

          {/* Reminders */}
          {deadline.reminders && deadline.reminders.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <AlertCircle size={14} /> Active Reminders
              </h3>
              <div className="flex flex-wrap gap-2">
                {deadline.reminders.map((r: any) => (
                  <span key={r} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium">
                    {r} Days Before
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-slate-50 border-t border-slate-100">
          {!isCompleted && (
            <button 
              onClick={handleMarkCompleted}
              className="w-full mb-3 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors"
            >
              <CheckCircle size={18} />
              Mark as Completed
            </button>
          )}
          
          <div className="flex gap-3">
            <button 
              onClick={() => onEdit(deadline)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium rounded-xl transition-colors"
            >
              <Edit2 size={16} />
              Edit
            </button>
            <button 
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-medium rounded-xl transition-colors"
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </>
  );
}
