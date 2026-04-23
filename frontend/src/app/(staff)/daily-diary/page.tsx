import { API_BASE } from '@/lib/api';
'use client';

import { useState, useEffect } from 'react';
import { Plus, CheckCircle2, Circle, Trash2, Calendar, ListTodo, CalendarDays } from 'lucide-react';

export default function DailyDiaryPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch('$\{API_BASE\}/tasks/');
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const res = await fetch('$\{API_BASE\}/tasks/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskTitle,
          due_date: newTaskDueDate || null,
          is_completed: false
        }),
      });
      if (res.ok) {
        setNewTaskTitle('');
        setNewTaskDueDate('');
        fetchTasks();
      }
    } catch (err) {
      console.error('Error adding task:', err);
    }
  };

  const toggleTaskStatus = async (task: any) => {
    // Optimistic UI update
    setTasks(prevTasks => prevTasks.map((t: any) => t.id === task.id ? { ...t, is_completed: !t.is_completed } : t));
    
    try {
      const res = await fetch(`$\{API_BASE\}/tasks/${task.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed: !task.is_completed }),
      });
      if (!res.ok) {
        // Revert on failure
        fetchTasks();
      }
    } catch (err) {
      console.error('Error updating task:', err);
      fetchTasks();
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    // Optimistic UI update
    setTasks(prevTasks => prevTasks.filter((t: any) => t.id !== id));
    
    try {
      const res = await fetch(`$\{API_BASE\}/tasks/${id}/`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        // Revert on failure
        fetchTasks();
      }
    } catch (err) {
      console.error('Error deleting task:', err);
      fetchTasks();
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const completedCount = tasks.filter((t: any) => t.is_completed).length;
  const totalCount = tasks.length;
  const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ListTodo className="text-blue-600" /> Daily Diary
          </h2>
          <p className="text-slate-500 mt-1">Manage your daily tasks and to-do lists.</p>
        </div>
        
        {totalCount > 0 && (
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Progress</span>
              <span className="text-sm font-bold text-slate-900">{completedCount} of {totalCount} done</span>
            </div>
            <div className="w-12 h-12 relative flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="24" cy="24" r="20" className="stroke-slate-100 fill-none stroke-4" strokeWidth="4" />
                <circle 
                  cx="24" cy="24" r="20" 
                  className="stroke-blue-500 fill-none transition-all duration-1000 ease-out" 
                  strokeWidth="4" 
                  strokeDasharray={`${progress * 1.25} 125`} 
                  strokeLinecap="round" 
                />
              </svg>
              <span className="absolute text-[10px] font-bold text-blue-600">{progress}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Add Task Form */}
      <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-slate-100 p-6">
        <form onSubmit={handleAddTask} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <input 
              type="text" 
              placeholder="What needs to be done?" 
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="w-full pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
            />
          </div>
          <div className="relative w-full sm:w-48 shrink-0">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="date" 
              value={newTaskDueDate}
              onChange={(e) => setNewTaskDueDate(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
            />
          </div>
          <button 
            type="submit"
            disabled={!newTaskTitle.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-sm shadow-blue-600/20 flex items-center justify-center gap-2 shrink-0"
          >
            <Plus size={20} /> Add Task
          </button>
        </form>
      </div>

      {/* Task List */}
      <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-slate-100 overflow-hidden">
        {loading && tasks.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400">
            <div className="w-8 h-8 border-4 border-slate-100 border-t-blue-500 rounded-full animate-spin mb-4"></div>
            <p>Loading tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 size={32} className="text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">All caught up!</h3>
            <p className="text-slate-500 max-w-sm">There are no pending tasks in your diary. Add a new task above to get started.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {tasks.map((task: any) => (
              <li 
                key={task.id} 
                className={`p-4 sm:p-5 flex items-start gap-4 transition-all duration-200 group hover:bg-slate-50/80 ${task.is_completed ? 'bg-slate-50/50' : ''}`}
              >
                <button 
                  onClick={() => toggleTaskStatus(task)}
                  className={`mt-0.5 shrink-0 transition-colors ${task.is_completed ? 'text-emerald-500 hover:text-emerald-600' : 'text-slate-300 hover:text-blue-500'}`}
                >
                  {task.is_completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                </button>
                
                <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className={`text-[15px] font-medium transition-all duration-200 break-words ${task.is_completed ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-800'}`}>
                      {task.title}
                    </span>
                  </div>
                  
                  {task.due_date && (
                    <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border w-fit shrink-0 ${task.is_completed ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                      <Calendar size={14} />
                      Due {formatDate(task.due_date)}
                    </div>
                  )}
                </div>

                <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleDelete(task.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    title="Delete Task"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
