'use client';

import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, Circle, Clock, MessageSquare, Briefcase, Users, FileText, Check, Activity } from 'lucide-react';
import Link from 'next/link';
import { API_BASE, apiFetch } from '@/lib/api';
import { ListSkeleton, TableRowSkeleton } from '@/components/SkeletonLoaders';

export function DailyTasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`${API_BASE}/tasks/`)
      .then(res => res.json())
      .then(data => {
        const tasksData = Array.isArray(data) ? data : (data.results || []);
        const pending = tasksData.filter((t: any) => !t.is_completed).slice(0, 5);
        setTasks(pending);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch tasks:', err);
        setLoading(false);
      });
  }, []);

  const toggleTask = async (task: any) => {
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, is_completed: true } : t));
    try {
      await apiFetch(`${API_BASE}/tasks/${task.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed: true }),
      });
    } catch (err) {
      console.error(err);
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, is_completed: false } : t));
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'text-rose-500 bg-rose-50 border-rose-200';
      case 'medium': return 'text-amber-500 bg-amber-50 border-amber-200';
      case 'low': return 'text-emerald-500 bg-emerald-50 border-emerald-200';
      default: return 'text-slate-500 bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-slate-900">Daily Tasks</h3>
        <Link href="/diary" className="text-xs font-semibold text-blue-600 hover:text-blue-700">View All Tasks</Link>
      </div>
      <div className="flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
        {loading ? (
          <ListSkeleton />
        ) : tasks.length === 0 ? (
          <div className="text-sm text-slate-500 italic">No pending tasks!</div>
        ) : (
          tasks.map(task => (
            <div key={task.id} className="flex items-start gap-3 group">
              <button onClick={() => !task.is_completed && toggleTask(task)} disabled={task.is_completed} className={`mt-0.5 shrink-0 ${task.is_completed ? 'text-blue-500' : 'text-slate-300 hover:text-blue-400'} transition-colors`}>
                {task.is_completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
              </button>
              <div className={`flex-1 ${task.is_completed ? 'opacity-50' : ''}`}>
                <p className={`text-sm font-bold text-slate-800 ${task.is_completed ? 'line-through' : ''}`}>{task.title}</p>
                <p className="text-[11px] font-medium text-slate-500">{task.description || 'No description'}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getPriorityColor(task.priority || 'Medium')}`}>
                  {task.priority || 'Medium'}
                </span>
                <span className="text-[10px] font-semibold text-slate-400">{task.due_date || 'No Date'}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function RecentActivity() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`${API_BASE}/audit-log/`)
      .then(res => res.json())
      .then(data => {
        const logs = Array.isArray(data) ? data : [];
        setActivities(logs.slice(0, 5));
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch audit logs:', err);
        setLoading(false);
      });
  }, []);

  const getActionData = (action: string, model: string) => {
    const data = { icon: Activity, color: 'text-slate-500', bg: 'bg-slate-50' };
    switch (action?.toLowerCase()) {
      case 'created': data.color = 'text-emerald-500'; data.bg = 'bg-emerald-50'; data.icon = CheckCircle2; break;
      case 'updated': data.color = 'text-blue-500'; data.bg = 'bg-blue-50'; data.icon = Clock; break;
      case 'deleted': data.color = 'text-rose-500'; data.bg = 'bg-rose-50'; data.icon = Circle; break;
    }
    switch (model?.toLowerCase()) {
      case 'client': data.icon = Users; break;
      case 'case': data.icon = Briefcase; break;
      case 'document': data.icon = FileText; break;
    }
    return data;
  };

  const timeAgo = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins} minutes ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${Math.floor(diffHours / 24)} days ago`;
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col">
      <h3 className="font-bold text-slate-900 mb-6">Recent Activity</h3>
      {loading ? (
        <ListSkeleton />
      ) : activities.length === 0 ? (
        <div className="text-sm text-slate-500 italic">No recent activity</div>
      ) : (
        <div className="relative border-l-2 border-slate-100 ml-3 space-y-6">
          {activities.map((act, i) => {
            const { icon: Icon, color, bg } = getActionData(act.action, act.model);
            return (
              <div key={i} className="relative pl-6">
                <div className={`absolute -left-[11px] top-0 w-5 h-5 rounded-full flex items-center justify-center ${bg} border-2 border-white`}>
                  <Icon size={10} className={color} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 leading-tight">
                    {act.model} {act.action?.toLowerCase()}
                  </p>
                  <p className="text-[11px] font-medium text-slate-500 mt-0.5 truncate" title={act.details}>{act.details}</p>
                  <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{timeAgo(act.date)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function TodaysHearingsList() {
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
        console.error("Failed to fetch today's hearings:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-slate-900">Today's Hearings</h3>
        <Link href="/cause-list" className="text-xs font-semibold text-blue-600 hover:text-blue-700">Cause List</Link>
      </div>
      
      {loading ? (
        <ListSkeleton />
      ) : hearings.length === 0 ? (
        <div className="text-sm text-slate-500 italic">No hearings scheduled for today.</div>
      ) : (
        <div className="relative border-l-2 border-slate-100 ml-12 space-y-8 mt-2 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
          {hearings.map((h, i) => (
            <div key={h.id || i} className="relative pl-6">
              <div className="absolute -left-[32px] top-0.5 w-6 h-6 rounded-full bg-blue-100 border-4 border-white flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              </div>
              <div className="absolute -left-[70px] top-1 text-xs font-bold text-slate-500">
                {h.time ? h.time.substring(0, 5) : 'TBD'}
              </div>
              
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 relative">
                <div className="flex justify-between items-start mb-1 gap-2">
                  <span className="text-xs font-bold text-slate-500 truncate">{h.court || 'Court TBD'}</span>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 whitespace-nowrap">
                    {h.hearing_stage || 'Hearing'}
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-900">{h.case_number}</p>
                <p className="text-[11px] font-medium text-slate-500 mt-1 truncate">{h.client_name} vs {h.opponent_name}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



export function RecentCasesTable() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`${API_BASE}/cases/?limit=5`)
      .then(res => res.json())
      .then(data => {
        setCases(Array.isArray(data) ? data.slice(0, 5) : (data.results || []).slice(0, 5));
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch cases:', err);
        setLoading(false);
      });
  }, []);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'pending': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'closed': return 'text-slate-600 bg-slate-50 border-slate-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-slate-900">Recent Cases</h3>
        <Link href="/cases" className="text-xs font-semibold text-blue-600 hover:text-blue-700">View All Cases</Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100">
              <th className="pb-3 pt-2 font-bold whitespace-nowrap">Case No.</th>
              <th className="pb-3 pt-2 font-bold whitespace-nowrap">Case Title</th>
              <th className="pb-3 pt-2 font-bold whitespace-nowrap">Client</th>
              <th className="pb-3 pt-2 font-bold whitespace-nowrap">Court</th>
              <th className="pb-3 pt-2 font-bold whitespace-nowrap">Created</th>
              <th className="pb-3 pt-2 font-bold whitespace-nowrap">Status</th>
            </tr>
          </thead>
          <tbody className="text-xs font-medium text-slate-700">
            {loading ? (
              <TableRowSkeleton columns={6} />
            ) : cases.length === 0 ? (
              <tr><td colSpan={6} className="py-4 text-center text-slate-500">No recent cases</td></tr>
            ) : (
              cases.map((c, i) => (
                <tr key={c.id || i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 font-semibold text-slate-900 whitespace-nowrap">
                    <Link href={`/cases/${c.id}`} className="hover:text-blue-600">{c.case_number}</Link>
                  </td>
                  <td className="py-3 whitespace-nowrap max-w-[150px] truncate" title={`${c.client_name} vs ${c.opponent_name}`}>
                    {c.client_name} vs {c.opponent_name}
                  </td>
                  <td className="py-3 whitespace-nowrap max-w-[120px] truncate" title={c.client_name}>{c.client_name}</td>
                  <td className="py-3 whitespace-nowrap max-w-[120px] truncate" title={c.court_details?.name}>{c.court_details?.name || '---'}</td>
                  <td className="py-3 font-semibold whitespace-nowrap">
                    {c.created_at ? new Date(c.created_at).toLocaleDateString('en-GB') : '---'}
                  </td>
                  <td className="py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold border ${getStatusColor(c.status)}`}>{c.status || 'Active'}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function CalendarWidget() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    // Use local timezone format for dates to fetch
    const startDateStr = new Date(year, month, 1).toLocaleDateString('en-CA'); // YYYY-MM-DD format usually
    const endDateStr = new Date(year, month + 1, 0).toLocaleDateString('en-CA');
    
    apiFetch(`${API_BASE}/calendar-events/?start=${startDateStr}&end=${endDateStr}`)
      .then(res => res.json())
      .then(data => {
        setEvents(Array.isArray(data) ? data : (data.results || []));
      })
      .catch(err => console.error('Failed to fetch calendar events:', err));
  }, [currentDate]);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const today = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  
  const dates = [];
  // previous month padding
  for (let i = 0; i < firstDay; i++) {
    dates.push({ day: '', currentMonth: false });
  }
  // current month
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    
    // Parse event dates properly into local time
    const dayEvents = events.filter(e => {
      if (!e.start_date) return false;
      const start = new Date(e.start_date);
      const eDateStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
      return eDateStr === dateStr;
    });
    
    const isToday = i === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
    dates.push({ 
      day: i, 
      currentMonth: true, 
      isSelected: isToday,
      isHearing: dayEvents.some(e => e.event_type === 'Court Hearing'),
      isMeeting: dayEvents.some(e => e.event_type === 'Client Meeting'),
      isDeadline: dayEvents.some(e => e.event_type === 'Filing Deadline')
    });
  }
  // next month padding
  const remaining = 42 - dates.length; // 6 rows * 7
  for (let i = 1; i <= remaining; i++) {
    dates.push({ day: '', currentMonth: false });
  }

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <button onClick={prevMonth} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">&lt;</button>
        <h3 className="font-bold text-slate-900 text-sm">{monthName}</h3>
        <button onClick={nextMonth} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">&gt;</button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {days.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-bold text-slate-400 py-1">{d}</div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-y-2 gap-x-1">
        {dates.map((d, i) => (
          <div key={i} className="flex justify-center items-center h-8 relative">
            {d.day && (
              <button 
                className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  d.isSelected ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30' : 
                  d.currentMonth ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300'
                }`}
              >
                {d.day}
              </button>
            )}
            {d.isHearing && <span className="absolute bottom-0 w-1 h-1 bg-blue-500 rounded-full"></span>}
            {d.isMeeting && <span className="absolute bottom-0 w-1 h-1 bg-emerald-500 rounded-full"></span>}
            {d.isDeadline && <span className="absolute bottom-0 w-1 h-1 bg-amber-500 rounded-full"></span>}
          </div>
        ))}
      </div>
      
      <div className="mt-6 flex justify-between px-2">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
          <span className="text-[10px] font-semibold text-slate-500">Hearing</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
          <span className="text-[10px] font-semibold text-slate-500">Meeting</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
          <span className="text-[10px] font-semibold text-slate-500">Deadline</span>
        </div>
      </div>
    </div>
  );
}
