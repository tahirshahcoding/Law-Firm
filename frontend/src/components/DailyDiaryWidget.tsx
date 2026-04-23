'use client';

import { useState, useEffect } from 'react';
import { CalendarCheck, Calendar as CalendarIcon, CheckCircle2, Circle, Clock, Check } from 'lucide-react';
import { API_BASE, apiFetch } from '@/lib/api';
import Link from 'next/link';
import { Calendar, ArrowRight } from 'lucide-react';

export default function DailyDiaryWidget() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = () => {
    apiFetch(`${API_BASE}/tasks/`)
      .then(res => res.json())
      .then(data => {
        // Just take the first 4 pending tasks for the widget
        const pending = data.filter((t: any) => !t.is_completed).slice(0, 4);
        setTasks(pending);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch tasks:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleToggleTask = async (task: any) => {
    // Optimistically remove from widget view
    setTasks((prevTasks: any) => prevTasks.filter((t: any) => t.id !== task.id));
    
    try {
      await apiFetch(`${API_BASE}/tasks/${task.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed: true }),
      });
    } catch (err) {
      console.error(err);
      // If fails, refetch to restore state
      fetchTasks();
    }
  };

  const formatDbDate = (dbDate: string) => {
    if (!dbDate) return '';
    const parts = dbDate.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    }
    return dbDate;
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-slate-100 mt-8">
      <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <Calendar size={20} />
          </div>
          <h3 className="font-bold text-lg text-slate-900">Daily Diary (To-Do)</h3>
        </div>
        <Link href="/diary" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors">
          View all tasks <ArrowRight size={16} />
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      ) : tasks.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {tasks.map((t: any) => (
            <div key={t.id} className="group p-4 border border-slate-100 rounded-xl hover:border-slate-200 hover:shadow-sm transition-all duration-200 flex justify-between items-start bg-white">
              <div className="flex items-start gap-3 flex-1">
                <button onClick={() => handleToggleTask(t)} className="text-slate-300 hover:text-emerald-500 transition-colors mt-0.5 shrink-0">
                  <Circle size={18} />
                </button>
                <div>
                  <p className="font-medium text-slate-900 line-clamp-2">{t.title}</p>
                  {t.due_date && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-rose-500 bg-rose-50 w-fit px-2 py-0.5 rounded border border-rose-100">
                      <Clock size={12}/> Due: {formatDbDate(t.due_date)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
          <CheckCircle2 size={32} className="text-slate-300 mb-3" />
          <p className="text-slate-900 font-medium">You're all caught up!</p>
          <p className="text-sm">No pending tasks in your daily diary.</p>
        </div>
      )}
    </div>
  );
}
