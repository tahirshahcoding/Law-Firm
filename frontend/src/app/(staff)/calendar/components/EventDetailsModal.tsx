'use client';

import React from 'react';
import { X, Calendar, Clock, MapPin, User, FolderOpen, Scale, AlignLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { CalendarEvent } from '../page';
import { getEventColors } from './CalendarViews';
import { useAuth } from '@/context/AuthContext';
import { API_BASE, apiFetch } from '@/lib/api';
import { useUI } from '@/context/UIContext';

interface EventDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  onEventDeleted?: () => void;
}

export function EventDetailsModal({ isOpen, onClose, event, onEventDeleted }: EventDetailsModalProps) {
  const { user } = useAuth();
  const { confirm, toast, showLoading, hideLoading } = useUI();

  if (!isOpen || !event) return null;

  const isManualEvent = ['Office Event', 'Staff Leave', 'Public Holiday'].includes(event.event_type);
  const canDelete = user?.role === 'Admin' && isManualEvent;

  const handleDelete = async () => {
    if (!canDelete) return;

    const ok = await confirm({
      title: 'Delete Event',
      message: 'Are you sure you want to delete this event? For synced events (hearings, tasks), this will only delete the calendar entry, not the original record.',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      showLoading('Deleting event...');
      const res = await apiFetch(`${API_BASE}/calendar-events/${event.id}/`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete event');
      toast.success('Event deleted successfully.');
      onEventDeleted?.();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete event');
    } finally {
      hideLoading();
    }
  };

  const colors = getEventColors(event.event_type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className={`p-6 border-b ${colors.split(' ')[0]} ${colors.split(' ')[2]}`}>
          <div className="flex justify-between items-start gap-4">
            <div>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 bg-white/60 ${colors.split(' ')[1]}`}>
                {event.event_type}
              </span>
              <h2 className="text-2xl font-bold text-slate-900 leading-tight">{event.title}</h2>
            </div>
            <button onClick={onClose} className="p-2 bg-white/50 hover:bg-white/80 rounded-full transition-colors shrink-0">
              <X size={20} className="text-slate-700" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 text-slate-700">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                <Calendar size={16} className="text-slate-500" />
              </div>
              <div>
                <div className="text-sm text-slate-500">Date</div>
                <div className="font-medium">
                  {new Date(event.start_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            </div>

            {!event.all_day && (
              <div className="flex items-center gap-3 text-slate-700">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  <Clock size={16} className="text-slate-500" />
                </div>
                <div>
                  <div className="text-sm text-slate-500">Time</div>
                  <div className="font-medium">
                    {new Date(event.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {event.end_date && ` - ${new Date(event.end_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                  </div>
                </div>
              </div>
            )}

            {event.location && (
              <div className="flex items-center gap-3 text-slate-700">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  <MapPin size={16} className="text-slate-500" />
                </div>
                <div>
                  <div className="text-sm text-slate-500">Location</div>
                  <div className="font-medium">{event.location}</div>
                </div>
              </div>
            )}
          </div>

          <hr className="border-slate-100" />

          <div className="grid grid-cols-2 gap-4">
            {event.case_number && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  <FolderOpen size={14} /> Case
                </div>
                {event.case ? (
                  <Link href={`/cases/${event.case}`} className="text-blue-600 hover:text-blue-800 hover:underline font-bold flex items-center gap-1">
                    {event.case_number}
                    <ExternalLink size={14} />
                  </Link>
                ) : (
                  <div className="font-bold text-slate-900">{event.case_number}</div>
                )}
              </div>
            )}
            
            {event.client_name && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  <User size={14} /> Client
                </div>
                {event.client ? (
                  <Link href={`/clients/${event.client}`} className="text-blue-600 hover:text-blue-800 hover:underline font-bold flex items-center gap-1">
                    {event.client_name}
                    <ExternalLink size={14} />
                  </Link>
                ) : (
                  <div className="font-bold text-slate-900">{event.client_name}</div>
                )}
              </div>
            )}

            {event.advocate_name && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  <User size={14} /> Assigned Advocate
                </div>
                <div className="font-bold text-slate-900">{event.advocate_name}</div>
              </div>
            )}

            {event.judge_name && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  <Scale size={14} /> Judge
                </div>
                <div className="font-bold text-slate-900">{event.judge_name}</div>
              </div>
            )}
          </div>

          {event.description && (
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                <AlignLeft size={16} /> Notes
              </div>
              <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-700 border border-slate-100 whitespace-pre-wrap">
                {event.description}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
          {canDelete && (
            <button 
              onClick={handleDelete}
              className="px-4 py-2 text-rose-600 font-medium hover:bg-rose-50 rounded-lg transition-colors mr-auto"
            >
              Delete Event
            </button>
          )}
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl transition-colors shadow-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
