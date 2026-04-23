'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Plus, CheckCircle2, Circle, Clock, Trash2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export default function DailyDiaryPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTasks = () => {
    apiFetch('http://localhost:8000/api/tasks/')
      .then(res => res.json())
      .then(data => {
        setTasks(data);
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
    try {
      const res = await apiFetch(`http://localhost:8000/api/tasks/${task.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed: !task.is_completed }),
      });
      if (!res.ok) throw new Error('Failed to update task');
      
      // Optimistically update UI
      setTasks((prevTasks: any) => 
        prevTasks.map((t: any) => t.id === task.id ? { ...t, is_completed: !task.is_completed } : t)
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      const res = await apiFetch(`http://localhost:8000/api/tasks/${id}/`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete task');
      setTasks((prevTasks: any) => prevTasks.filter((t: any) => t.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setIsSubmitting(true);

    const payload: any = {
      title: newTaskTitle,
      is_completed: false
    };

    if (newTaskDueDate) {
      payload.due_date = newTaskDueDate; // Native date picker gives YYYY-MM-DD
    }

    try {
      const res = await apiFetch('http://localhost:8000/api/tasks/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add task');
      
      setNewTaskTitle('');
      setNewTaskDueDate('');
      fetchTasks();
    } catch (err) {
      console.error(err);
      alert('Error adding task: ' + err.message);
    } finally {
      setIsSubmitting(false);
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
              disabled={isSubmitting || !newTaskTitle.trim()}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-sm shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <Plus size={18} /> Add
                </>
              )}
            </button>
          </form>
        </div>

        {/* Task List */}
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center text-slate-400">
            <div className="w-8 h-8 border-4 border-slate-100 border-t-blue-500 rounded-full animate-spin mb-4"></div>
            <p>Loading active tasks...</p>
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
                          <button onClick={() => handleToggleTask(task)} className="text-emerald-500">
                            <CheckCircle2 size={22} />
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
