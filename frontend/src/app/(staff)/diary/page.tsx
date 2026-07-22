'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Plus, CheckCircle2, Circle, Clock, Trash2, Gavel, Scale, FolderOpen } from 'lucide-react';
import { API_BASE, apiFetch } from '@/lib/api';
import { ListSkeleton } from '@/components/SkeletonLoaders';
import useSWR from 'swr';
import { swrFetcher } from '@/lib/fetcher';
import { toast } from 'sonner';
import { useUI } from '@/context/UIContext';

export default function DailyDiaryPage() {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const { confirm, showLoading, hideLoading } = useUI();

  const { data: tasksData, isLoading: tasksLoading, mutate: mutateTasks } = useSWR(`${API_BASE}/tasks/?limit=1000`, swrFetcher);
  const { data: hearingsData, isLoading: hearingsLoading, mutate: mutateHearings } = useSWR(`${API_BASE}/diary/today/`, swrFetcher);

  const loading = tasksLoading || hearingsLoading;
  
  const rawTasks = Array.isArray(tasksData) ? tasksData : (tasksData?.results || []);
  const rawHearings = Array.isArray(hearingsData) ? hearingsData : (hearingsData?.results || []);
  const hearings = [...rawHearings].sort((a: any, b: any) => a.case_title?.localeCompare(b.case_title));
  // optimistic state for tasks
  const [optimisticTasks, setOptimisticTasks] = useState<any[] | null>(null);
  
  // Update optimistic tasks when rawTasks change
  useEffect(() => {
    setOptimisticTasks(Array.isArray(tasksData) ? tasksData : (tasksData?.results || []));
  }, [tasksData]);

  const tasks = optimisticTasks || rawTasks;

  const fetchTasksAndHearings = () => {
    mutateTasks();
    mutateHearings();
  };

  const handleToggleTask = async (task: any) => {
    setOptimisticTasks((prevTasks: any) => 
      (prevTasks || tasks).map((t: any) => t.id === task.id ? { ...t, is_completed: !task.is_completed } : t)
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
      setOptimisticTasks((prevTasks: any) => 
        (prevTasks || tasks).map((t: any) => t.id === task.id ? { ...t, is_completed: task.is_completed } : t)
      );
    } finally {
      mutateTasks();
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
      setOptimisticTasks((prevTasks: any) => (prevTasks || tasks).filter((t: any) => t.id !== id));
      mutateTasks();
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
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Daily Diary</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your active office to-do list and priorities.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors">
        {/* Add Task Form */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 transition-colors">
          <form onSubmit={handleAddTask} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1 w-full relative">
              <input 
                type="text" 
                placeholder="What needs to be done?" 
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="w-full pl-4 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium"
                required
              />
            </div>
            <div className="w-full sm:w-48 relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
              <input 
                type="date" 
                value={newTaskDueDate}
                onChange={handleDateMask}
                className="w-full pl-9 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-slate-700 dark:text-slate-300"
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
          <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 transition-colors">
            <div className="px-6 py-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
                <Gavel size={16} /> Cause List - Today's Hearings ({hearings.length})
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {hearings.map((h: any) => (
                  <div key={h.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 sm:p-5 shadow-sm dark:shadow-none hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-lg text-slate-900 dark:text-white">{h.case_number}</span>
                          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">vs {h.opponent_name}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1.5"><Scale size={14} className="text-slate-400 dark:text-slate-500" /> {h.court}</span>
                          <span className="hidden sm:inline text-slate-300 dark:text-slate-600">•</span>
                          <span className="flex items-center gap-1.5"><FolderOpen size={14} className="text-slate-400 dark:text-slate-500" /> {h.judge}</span>
                        </div>
                      </div>
                      {h.notes && (
                        <div className="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-2 rounded-lg text-sm w-full sm:w-auto mt-2 sm:mt-0 border border-amber-100 dark:border-amber-800/50">
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
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {pendingTasks.length === 0 && completedTasks.length === 0 ? (
              <div className="p-16 text-center text-slate-500 dark:text-slate-400">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} className="text-slate-300 dark:text-slate-500" />
                </div>
                <p className="text-lg font-medium text-slate-900 dark:text-white mb-1">You're all caught up!</p>
                <p className="text-sm">There are no tasks pending in your daily diary.</p>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {/* Pending Tasks */}
                {pendingTasks.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4 ml-1">Pending</h3>
                    {pendingTasks.map((task: any) => (
                      <div key={task.id} className="group flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-slate-200 dark:hover:border-slate-600 hover:shadow-sm dark:shadow-none transition-all duration-200">
                        <div className="flex items-center gap-4 flex-1">
                          <button onClick={() => handleToggleTask(task)} className="text-slate-300 dark:text-slate-500 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">
                            <Circle size={22} />
                          </button>
                          <div className="flex-1">
                            <p className="text-slate-900 dark:text-white font-medium">{task.title}</p>
                            {task.due_date && (
                              <p className="text-xs text-rose-500 dark:text-rose-400 mt-1 font-semibold flex items-center gap-1.5 bg-rose-50 dark:bg-rose-900/30 w-fit px-2 py-0.5 rounded border border-rose-100 dark:border-rose-800">
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
                  <div className="space-y-3 pt-6 border-t border-slate-100/60 dark:border-slate-700/60 mt-6">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-500/70 dark:text-emerald-400/70 mb-4 ml-1">Completed</h3>
                    {completedTasks.map((task: any) => (
                      <div key={task.id} className="group flex items-center justify-between p-3 opacity-60 hover:opacity-100 transition-opacity duration-200">
                        <div className="flex items-center gap-4 flex-1">
                          <button onClick={() => handleToggleTask(task)} className="text-amber-500 dark:text-amber-400">
                            <CheckCircle2 size={22} className="fill-amber-50 dark:fill-amber-900/30" />
                          </button>
                          <div className="flex-1">
                            <p className="text-slate-500 dark:text-slate-400 font-medium line-through decoration-slate-300 dark:decoration-slate-500">{task.title}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDeleteTask(task.id)}
                          className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-all"
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
