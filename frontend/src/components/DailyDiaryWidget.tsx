'use client';

import { useState, useEffect } from 'react';
import { CalendarCheck, Calendar as CalendarIcon, CheckCircle2, Circle, Clock, Check } from 'lucide-react';
import { API_BASE, apiFetch } from '@/lib/api';
import Link from 'next/link';
import { Calendar, ArrowRight } from 'lucide-react';
import { WidgetSkeleton } from '@/components/SkeletonLoaders';

export default function DailyDiaryWidget() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = () => {
    apiFetch(`${API_BASE}/tasks/`)
      .then(res => res.json())
      .then(data => {
        const tasksData = data.results || data;
        // Just take the first 4 pending tasks for the widget
        const pending = tasksData.filter((t: any) => !t.is_completed).slice(0, 4);
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
    // Optimistically update the UI to show it as completed
    setTasks((prevTasks: any) => 
      prevTasks.map((t: any) => 
        t.id === task.id ? { ...t, is_completed: true } : t
      )
    );
    
    try {
      await apiFetch(`${API_BASE}/tasks/${task.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed: true }),
      });
      // Optionally, you might want to remove it after a delay, or keep it visible
      // Let's keep it visible with the gold checkmark as requested
    } catch (err) {
      console.error(err);
      // Revert optimism if it fails
      setTasks((prevTasks: any) => 
        prevTasks.map((t: any) => 
          t.id === task.id ? { ...t, is_completed: false } : t
        )
      );
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

  if (loading) {
    return <WidgetSkeleton />;
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-slate-100 dark:border-slate-800 mt-8">
      <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <Calendar size={20} />
          </div>
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">Daily Diary (To-Do)</h3>
        </div>
        <Link href="/diary" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors">
          View all tasks <ArrowRight size={16} />
        </Link>
      </div>

      {tasks.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {tasks.map((t: any) => (
            <div key={t.id} className={`group p-4 border rounded-xl transition-all duration-200 flex justify-between items-start bg-white ${t.is_completed ? 'border-amber-200 shadow-sm shadow-amber-100/50' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:border-slate-700 hover:shadow-sm'}`}>
              <div className="flex items-start gap-3 flex-1">
                <button 
                  onClick={() => !t.is_completed && handleToggleTask(t)} 
                  disabled={t.is_completed}
                  className={`mt-0.5 shrink-0 transition-colors ${t.is_completed ? 'text-amber-500' : 'text-slate-300 hover:text-emerald-500'}`}
                >
                  {t.is_completed ? <CheckCircle2 size={18} className="fill-amber-50" /> : <Circle size={18} />}
                </button>
                <div>
                  <p className={`font-medium line-clamp-2 transition-colors ${t.is_completed ? 'text-slate-500 dark:text-slate-400 line-through' : 'text-slate-900 dark:text-white'}`}>
                    {t.title}
                  </p>
                  {t.due_date && (
                    <div className={`flex items-center gap-1.5 mt-2 text-xs font-semibold w-fit px-2 py-0.5 rounded border ${t.is_completed ? 'text-slate-400 bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800' : 'text-rose-500 bg-rose-50 border-rose-100'}`}>
                      <Clock size={12}/> Due: {formatDbDate(t.due_date)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
          <CheckCircle2 size={32} className="text-slate-300 mb-3" />
          <p className="text-slate-900 dark:text-white font-medium">You're all caught up!</p>
          <p className="text-sm">No pending tasks in your daily diary.</p>
        </div>
      )}
    </div>
  );
}
