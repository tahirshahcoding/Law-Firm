'use client';

import { useState, useEffect } from 'react';
import { Gavel, ArrowRight, CalendarDays, Scale } from 'lucide-react';
import { API_BASE, apiFetch } from '@/lib/api';
import Link from 'next/link';
import { WidgetSkeleton } from '@/components/SkeletonLoaders';

export default function CauseListWidget() {
  const [hearings, setHearings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - (offset * 60 * 1000));
    const dateStr = localToday.toISOString().split('T')[0];

    apiFetch(`${API_BASE}/hearings/?date=${dateStr}`)
      .then(res => res.json())
      .then(data => {
        setHearings(Array.isArray(data) ? data : (data.results || []));
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch today's hearings for widget:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <WidgetSkeleton />;
  }

  // Group hearings by stage/class
  const groupHearings = (list: any[]) => {
    const groups: { [key: string]: any[] } = {};
    list.forEach((h: any) => {
      const stage = h.hearing_stage ? h.hearing_stage.trim() : 'Miscellaneous';
      const normalizedStage = stage.charAt(0).toUpperCase() + stage.slice(1);
      if (!groups[normalizedStage]) {
        groups[normalizedStage] = [];
      }
      groups[normalizedStage].push(h);
    });
    return groups;
  };

  const grouped = groupHearings(hearings);
  const stages = Object.keys(grouped);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-slate-100 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <Gavel size={20} />
          </div>
          <h3 className="font-bold text-lg text-slate-900">Today's Cause List</h3>
        </div>
        <Link href="/cause-list" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors">
          Full Cause List <ArrowRight size={16} />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[320px] pr-1 space-y-4 custom-scrollbar">
        {hearings.length > 0 ? (
          stages.map(stage => (
            <div key={stage} className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-l-2 border-blue-500 pl-2">
                {stage} ({grouped[stage].length})
              </h4>
              <div className="space-y-2">
                {grouped[stage].map((h: any) => (
                  <div key={h.id} className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-100 rounded-xl transition-all flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-slate-800">{h.case_number}</p>
                      <p className="text-xs text-slate-500 font-medium truncate">
                        {h.client_name || 'Client'} vs {h.opponent_name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400 font-medium">
                        <Scale size={10} />
                        <span className="truncate">{h.court}</span>
                      </div>
                    </div>
                    {h.next_date && (
                      <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded mt-0.5">
                        ND: {h.next_date.split('-').reverse().slice(0, 2).reverse().join('/')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="h-full py-12 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <CalendarDays size={32} className="text-slate-300 mb-3" />
            <p className="text-slate-900 font-medium">No Hearings Today</p>
            <p className="text-sm">Enjoy your clear schedule.</p>
          </div>
        )}
      </div>
    </div>
  );
}
