'use client';

import React from 'react';
import { CalendarEvent } from '../page';
import { Clock, MapPin } from 'lucide-react';

export const getEventColors = (type: string) => {
  switch (type) {
    case 'Court Hearing': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-200 dark:hover:bg-blue-900/50';
    case 'Client Meeting': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-200 dark:hover:bg-emerald-900/50';
    case 'Filing Deadline': return 'bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800 hover:bg-rose-200 dark:hover:bg-rose-900/50';
    case 'Payment Due': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-200 dark:hover:bg-amber-900/50';
    case 'Internal Task': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-200 dark:hover:bg-purple-900/50';
    default: return 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'; // Office Event, Staff Leave, Public Holiday
  }
};

const formatTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Helper to reliably get the local YYYY-MM-DD from an ISO string
export const getLocalISODate = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Helper to group events by local date spanning from start_date to end_date
export const groupEventsByDate = (events: CalendarEvent[]) => {
  return events.reduce((acc, event) => {
    const start = new Date(event.start_date);
    const end = event.end_date ? new Date(event.end_date) : new Date(start);
    
    // Safety check to prevent infinite loops if data is malformed
    if (end < start) end.setTime(start.getTime());

    // Normalize to midnight local time to iterate day by day
    const current = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const final = new Date(end.getFullYear(), end.getMonth(), end.getDate());

    do {
      const dStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
      if (!acc[dStr]) acc[dStr] = [];
      // Prevent duplicates if an event is exactly at midnight ending
      if (!acc[dStr].find(e => e.id === event.id)) {
        acc[dStr].push(event);
      }
      current.setDate(current.getDate() + 1);
    } while (current <= final);

    return acc;
  }, {} as Record<string, CalendarEvent[]>);
};

// ── Monthly View ─────────────────────────────────────────────────────────────
export function MonthlyView({ currentDate, events, onEventClick, onDateClick }: { currentDate: Date, events: CalendarEvent[], onEventClick: (e: CalendarEvent) => void, onDateClick: (d: Date) => void }) {
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay === 0 ? 6 : firstDay - 1 }, (_, i) => i); // Assuming Monday start

  const groupedEvents = React.useMemo(() => groupEventsByDate(events), [events]);
  const todayStr = getLocalISODate(new Date().toISOString());

  return (
    <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
      <div className="grid grid-cols-7 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 min-w-[800px] transition-colors">
      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
        <div key={d} className="bg-slate-50 dark:bg-slate-800 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 transition-colors">
          {d}
        </div>
      ))}
      
      {blanks.map(b => <div key={`blank-${b}`} className="min-h-[120px] bg-slate-50/50 dark:bg-slate-800/50 border-r border-b border-slate-100 dark:border-slate-800 last:border-r-0 transition-colors" />)}
      
      {days.map(day => {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayEvents = groupedEvents[dateStr] || [];
        
        return (
          <div 
            key={day} 
            onClick={() => onDateClick(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
            className="min-h-[120px] border-r border-b border-slate-100 dark:border-slate-800 last:border-r-0 p-2 hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer transition-colors flex flex-col gap-1"
          >
            <div className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mb-1 transition-colors ${
              todayStr === dateStr ? 'bg-blue-600 text-white shadow-md' : 'text-slate-700 dark:text-slate-300'
            }`}>
              {day}
            </div>
            <div className="flex-1 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
              {dayEvents.map(event => (
                <div 
                  key={event.id}
                  onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                  className={`text-xs px-2 py-1 rounded border truncate font-medium ${getEventColors(event.event_type)}`}
                  title={event.title}
                >
                  {!event.all_day && <span className="opacity-70 mr-1">{formatTime(event.start_date)}</span>}
                  {event.title}
                </div>
              ))}
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}

// ── Weekly View ─────────────────────────────────────────────────────────────
export function WeeklyView({ currentDate, events, onEventClick }: { currentDate: Date, events: CalendarEvent[], onEventClick: (e: CalendarEvent) => void }) {
  const getDay = (date: Date) => {
    const day = date.getDay();
    if (day === 0) return 6; // Make Sunday the last day
    return day - 1; // Make Monday 0
  };

  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - getDay(currentDate));

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  const groupedEvents = React.useMemo(() => groupEventsByDate(events), [events]);
  const todayStr = getLocalISODate(new Date().toISOString());

  return (
    <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
      <div className="grid grid-cols-7 gap-4 min-w-[800px]">
      {weekDays.map(date => {
        const dateStr = getLocalISODate(date.toISOString());
        const dayEvents = (groupedEvents[dateStr] || []).sort((a,b) => a.start_date.localeCompare(b.start_date));
        const isToday = todayStr === dateStr;

        return (
          <div key={dateStr} className={`bg-white dark:bg-slate-900 border rounded-xl overflow-hidden flex flex-col min-h-[400px] transition-colors ${isToday ? 'border-blue-200 dark:border-blue-800 ring-2 ring-blue-100 dark:ring-blue-900/30' : 'border-slate-200 dark:border-slate-800'}`}>
            <div className={`py-3 text-center border-b transition-colors ${isToday ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-400' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}>
              <div className="text-xs font-semibold uppercase">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
              <div className="text-lg font-bold mt-0.5">{date.getDate()}</div>
            </div>
            <div className="flex-1 p-2 space-y-2 overflow-y-auto">
              {dayEvents.length === 0 && <div className="text-xs text-center text-slate-400 dark:text-slate-500 mt-4">No events</div>}
              {dayEvents.map(event => (
                <div 
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className={`p-2 rounded-lg border text-sm cursor-pointer hover:shadow-sm transition-all ${getEventColors(event.event_type)}`}
                >
                  <div className="font-semibold mb-1 truncate">{event.title}</div>
                  {!event.all_day && (
                    <div className="flex items-center gap-1 text-[11px] opacity-80 mt-1">
                      <Clock size={12} /> {formatTime(event.start_date)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}

// ── Daily View ──────────────────────────────────────────────────────────────
export function DailyView({ currentDate, events, onEventClick }: { currentDate: Date, events: CalendarEvent[], onEventClick: (e: CalendarEvent) => void }) {
  const dateStr = getLocalISODate(currentDate.toISOString());
  const groupedEvents = React.useMemo(() => groupEventsByDate(events), [events]);
  const dayEvents = (groupedEvents[dateStr] || []).sort((a,b) => a.start_date.localeCompare(b.start_date));

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-w-3xl mx-auto shadow-sm transition-colors">
      <div className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 p-4 text-center transition-colors">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white">
          {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </h3>
      </div>
      <div className="p-4 sm:p-6 space-y-4 min-h-[400px]">
        {dayEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400 dark:text-slate-500">
            <Clock size={32} className="mb-2 opacity-50" />
            <p>No events scheduled for this day.</p>
          </div>
        ) : (
          dayEvents.map(event => (
            <div 
              key={event.id}
              onClick={() => onEventClick(event)}
              className={`p-4 rounded-xl border flex items-start gap-4 cursor-pointer hover:shadow-md transition-all ${getEventColors(event.event_type)}`}
            >
              <div className="w-20 shrink-0 text-center font-bold">
                {event.all_day ? 'All Day' : formatTime(event.start_date)}
              </div>
              <div className="flex-1 border-l pl-4 border-current border-opacity-20">
                <h4 className="text-lg font-bold">{event.title}</h4>
                <p className="text-sm opacity-80 font-medium mb-2">{event.event_type}</p>
                
                {event.location && (
                  <div className="flex items-center gap-1.5 text-sm opacity-90">
                    <MapPin size={14} /> {event.location}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function AgendaView({ events, onEventClick }: { events: CalendarEvent[], onEventClick: (e: CalendarEvent) => void }) {
  if (events.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center text-slate-500 dark:text-slate-400 shadow-sm transition-colors">
        No upcoming events found.
      </div>
    );
  }

  // Group events by date
  const grouped = React.useMemo(() => groupEventsByDate(events), [events]);
  const sortedDates = Object.keys(grouped).sort();
  const todayStr = getLocalISODate(new Date().toISOString());

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm transition-colors">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm transition-colors">
            <th className="px-6 py-4 font-semibold uppercase tracking-wider w-40">Date</th>
            <th className="px-6 py-4 font-semibold uppercase tracking-wider w-32">Time</th>
            <th className="px-6 py-4 font-semibold uppercase tracking-wider">Event Details</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {sortedDates.map(date => {
            // Reconstruct local date at midnight to avoid offset shifts
            const [y, m, d] = date.split('-').map(Number);
            const dateObj = new Date(y, m - 1, d);
            const dateLabel = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
            return grouped[date].sort((a,b) => a.start_date.localeCompare(b.start_date)).map((event, idx) => (
              <tr 
                key={event.id} 
                onClick={() => onEventClick(event)}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group"
              >
                {idx === 0 ? (
                  <td className="px-6 py-4 align-top border-r border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors" rowSpan={grouped[date].length}>
                    <div className="font-bold text-slate-800 dark:text-white">{dateLabel}</div>
                    {todayStr === date && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 text-[10px] font-bold uppercase rounded-full">Today</span>
                    )}
                  </td>
                ) : null}
                <td className="px-6 py-4 align-top text-slate-600 dark:text-slate-400 font-medium">
                  {event.all_day ? 'All Day' : formatTime(event.start_date)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${getEventColors(event.event_type).split(' ')[0]}`} />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{event.title}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
                        <span className="font-medium px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-400 text-xs transition-colors">{event.event_type}</span>
                        {event.location && <span className="flex items-center gap-1"><MapPin size={12}/> {event.location}</span>}
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            ));
          })}
        </tbody>
      </table>
    </div>
  );
}
