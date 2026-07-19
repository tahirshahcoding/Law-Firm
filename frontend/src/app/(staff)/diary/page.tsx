'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Plus, CheckCircle2, Circle, Clock, Trash2, Gavel, Scale, FolderOpen } from 'lucide-react';
import { API_BASE, apiFetch } from '@/lib/api';
import { ListSkeleton } from '@/components/SkeletonLoaders';
import { toast } from 'sonner';
import { useUI } from '@/context/UIContext';

export default function DailyDiaryPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [hearings, setHearings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const { confirm, showLoading, hideLoading } = useUI();

  const fetchTasksAndHearings = () => {
    setLoading(true);
    Promise.all([
      apiFetch(`${API_BASE}/tasks/`).then(res => res.json()),
      apiFetch(`${API_BASE}/diary/today/`).then(res => res.json())
    ])
      .then(([tasksData, hearingsData]) => {
        setTasks(Array.isArray(tasksData) ? tasksData : tasksData.results || []);
        // Handle nested results for hearings array if paginated
        const parsedHearings = Array.isArray(hearingsData) ? hearingsData : hearingsData.results || [];
        // Sort hearings by case title naturally
        parsedHearings.sort((a: any, b: any) => a.case_title?.localeCompare(b.case_title));
        setHearings(parsedHearings);
      })
      .catch(err => {
        console.error('Failed to fetch data:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTasksAndHearings();
  }, []);

  const handleToggleTask = async (task: any) => {
    // Fully Optimistic UI: update immediately
    setTasks((prevTasks: any) => 
      prevTasks.map((t: any) => t.id === task.id ? { ...t, is_completed: !task.is_completed } : t)
    );

    try {
      const res = await apiFetch(`${API_BASE}/tasks/${task.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed: !task.is_completed }),
      });
      if (!res.ok) throw new Error('Failed to update task');
    } catch (err) {
      console.error(err);
      // Revert optimism on failure
      setTasks((prevTasks: any) => 
        prevTasks.map((t: any) => t.id === task.id ? { ...t, is_completed: task.is_completed } : t)
      );
    }
  };

  const handleDeleteTask = async (id: string) => {
    const ok = await confirm({
      title: 'Delete Task',
      message: 'This will permanently remove the task from your diary.',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      showLoading('Deleting task...');
      const res = await apiFetch(`${API_BASE}/tasks/${id}/`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete task');
      toast.success("Task deleted");
      setTasks((prevTasks: any) => prevTasks.filter((t: any) => t.id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      hideLoading();
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const payload: any = {
      title: newTaskTitle,
      is_completed: false
    };

    if (newTaskDueDate) {
      payload.due_date = newTaskDueDate; // Native date picker gives YYYY-MM-DD
    }

    try {
      showLoading('Adding task...');
      const res = await apiFetch(`${API_BASE}/tasks/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add task');
      
      setNewTaskTitle('');
      setNewTaskDueDate('');
      toast.success("Task added");
      fetchTasksAndHearings();
    } catch (err) {
      console.error(err);
      toast.error('Error adding task: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      hideLoading();
    }
  };

  // Removed custom text masking since we use native date picker
  const handleDateMask = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTaskDueDate(e.target.value);
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

  const pendingTasks = tasks.filter((t: any) => !t.is_completed);
  const completedTasks = tasks.filter((t: any) => t.is_completed);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Daily Diary</h2>
          <p className="text-slate-500 mt-1">Manage your active office to-do list and priorities.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-slate-100 overflow-hidden">
        {/* Add Task Form */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <form onSubmit={handleAddTask} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1 w-full relative">
              <input 
                type="text" 
                placeholder="What needs to be done?" 
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="w-full pl-4 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 font-medium"
                required
              />
            </div>
            <div className="w-full sm:w-48 relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="date" 
                value={newTaskDueDate}
                onChange={handleDateMask}
                className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-slate-700"
              />
            </div>
            <button 
              type="submit"
              disabled={!newTaskTitle.trim()}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 duration-300 shadow-[0_4px_12px_rgba(37,99,235,0.25)] hover:shadow-[0_6px_16px_rgba(37,99,235,0.35)] hover:-translate-y-0.5 px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-white"
            >
              <Plus size={18} /> Add
            </button>
          </form>
        </div>

        {/* Today's Hearings */}
        {!loading && hearings.length > 0 && (
          <div className="border-b border-slate-100 bg-slate-50">
            <div className="px-6 py-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                <Gavel size={16} /> Cause List - Today's Hearings ({hearings.length})
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {hearings.map((h: any) => (
                  <div key={h.id} className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-lg text-slate-900">{h.case_number}</span>
                          <span className="text-sm font-medium text-slate-500">vs {h.opponent_name}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-slate-600">
                          <span className="flex items-center gap-1.5"><Scale size={14} className="text-slate-400" /> {h.court}</span>
                          <span className="hidden sm:inline text-slate-300">•</span>
                          <span className="flex items-center gap-1.5"><FolderOpen size={14} className="text-slate-400" /> {h.judge}</span>
                        </div>
                      </div>
                      {h.notes && (
                        <div className="bg-amber-50 text-amber-700 px-3 py-2 rounded-lg text-sm w-full sm:w-auto mt-2 sm:mt-0">
                          {h.notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Task List */}
        {loading ? (
          <div className="p-6">
            <ListSkeleton />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingTasks.length === 0 && completedTasks.length === 0 ? (
              <div className="p-16 text-center text-slate-500">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} className="text-slate-300" />
                </div>
                <p className="text-lg font-medium text-slate-900 mb-1">You're all caught up!</p>
                <p className="text-sm">There are no tasks pending in your daily diary.</p>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {/* Pending Tasks */}
                {pendingTasks.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 ml-1">Pending</h3>
                    {pendingTasks.map((task: any) => (
                      <div key={task.id} className="group flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl hover:border-slate-200 hover:shadow-sm transition-all duration-200">
                        <div className="flex items-center gap-4 flex-1">
                          <button onClick={() => handleToggleTask(task)} className="text-slate-300 hover:text-emerald-500 transition-colors">
                            <Circle size={22} />
                          </button>
                          <div className="flex-1">
                            <p className="text-slate-900 font-medium">{task.title}</p>
                            {task.due_date && (
                              <p className="text-xs text-rose-500 mt-1 font-semibold flex items-center gap-1.5 bg-rose-50 w-fit px-2 py-0.5 rounded border border-rose-100">
                                <Clock size={12} /> Due: {formatDbDate(task.due_date)}
                              </p>
                            )}
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDeleteTask(task.id)}
                          className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Completed Tasks */}
                {completedTasks.length > 0 && (
                  <div className="space-y-3 pt-6 border-t border-slate-100/60 mt-6">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-500/70 mb-4 ml-1">Completed</h3>
                    {completedTasks.map((task: any) => (
                      <div key={task.id} className="group flex items-center justify-between p-3 opacity-60 hover:opacity-100 transition-opacity duration-200">
                        <div className="flex items-center gap-4 flex-1">
                          <button onClick={() => handleToggleTask(task)} className="text-amber-500">
                            <CheckCircle2 size={22} className="fill-amber-50" />
                          </button>
                          <div className="flex-1">
                            <p className="text-slate-500 font-medium line-through decoration-slate-300">{task.title}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDeleteTask(task.id)}
                          className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
