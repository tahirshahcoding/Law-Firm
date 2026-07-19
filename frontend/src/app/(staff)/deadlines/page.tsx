'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Calendar, CheckCircle, AlertTriangle, Clock, ChevronRight } from 'lucide-react';
import { API_BASE, apiFetch } from '@/lib/api';
import { useUI } from '@/context/UIContext';
import CreateDeadlineModal from '@/components/deadlines/CreateDeadlineModal';
import DeadlineDrawer from '@/components/deadlines/DeadlineDrawer';

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function DeadlinesPage() {
  const { toast } = useUI();
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDeadline, setSelectedDeadline] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchDeadlines = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (typeFilter) params.append('deadline_type', typeFilter);

      const res = await apiFetch(`${API_BASE}/deadlines/?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setDeadlines(data.results || data);
      } else {
        toast.error("Failed to load deadlines");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading deadlines");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeadlines();
  }, [statusFilter, priorityFilter, typeFilter]);

  const handleRowClick = (deadline: any) => {
    setSelectedDeadline(deadline);
    setIsDrawerOpen(true);
  };

  // Stats
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const weekFromNow = new Date(today);
  weekFromNow.setDate(weekFromNow.getDate() + 7);

  const statToday = deadlines.filter(d => {
    const due = new Date(d.due_date);
    return due.getTime() === today.getTime() && d.status !== 'Completed';
  }).length;

  const statWeek = deadlines.filter(d => {
    const due = new Date(d.due_date);
    return due >= today && due <= weekFromNow && d.status !== 'Completed';
  }).length;

  const statOverdue = deadlines.filter(d => {
    const due = new Date(d.due_date);
    return due < today && d.status !== 'Completed';
  }).length;

  const statCompleted = deadlines.filter(d => d.status === 'Completed').length;

  // Search Filter
  const filteredDeadlines = deadlines.filter(d => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      d.title.toLowerCase().includes(term) ||
      d.case_number?.toLowerCase().includes(term) ||
      d.client_name?.toLowerCase().includes(term) ||
      d.assigned_user_name?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Deadlines</h2>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">Track all your upcoming obligations and tasks.</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 duration-300 shadow-[0_4px_12px_rgba(37,99,235,0.25)] hover:shadow-[0_6px_16px_rgba(37,99,235,0.35)] hover:-translate-y-0.5 px-5 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 text-white"
        >
          <Plus size={18} /> New Deadline
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-amber-50 rounded-xl">
            <Clock size={24} className="text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Due Today</p>
            <p className="text-2xl font-bold text-slate-800">{statToday}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-blue-50 rounded-xl">
            <Calendar size={24} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">This Week</p>
            <p className="text-2xl font-bold text-slate-800">{statWeek}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-rose-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-rose-50 rounded-xl">
            <AlertTriangle size={24} className="text-rose-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-rose-600">Overdue</p>
            <p className="text-2xl font-bold text-slate-800">{statOverdue}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-emerald-50 rounded-xl">
            <CheckCircle size={24} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Completed</p>
            <p className="text-2xl font-bold text-slate-800">{statCompleted}</p>
          </div>
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200/60 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search deadlines..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-sm"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl whitespace-nowrap">
              <Filter size={16} className="text-slate-400" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-sm text-slate-700 outline-none cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl whitespace-nowrap">
              <select 
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-transparent text-sm text-slate-700 outline-none cursor-pointer"
              >
                <option value="">All Priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/50 text-slate-500 font-medium border-b border-slate-200/60">
              <tr>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Case</th>
                <th className="px-6 py-4">Assigned To</th>
                <th className="px-6 py-4">Due Date</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">Loading deadlines...</td>
                </tr>
              ) : filteredDeadlines.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <Calendar size={32} className="mx-auto mb-3 text-slate-300" />
                    No deadlines found.
                  </td>
                </tr>
              ) : (
                filteredDeadlines.map((deadline, index) => {
                  const dueDate = new Date(deadline.due_date);
                  const isOverdue = dueDate < today && deadline.status !== 'Completed';
                  const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
                  
                  return (
                    <tr 
                      key={deadline.id} 
                      onClick={() => handleRowClick(deadline)}
                      className={`hover:bg-slate-50/80 transition-colors cursor-pointer group ${isOverdue ? 'bg-rose-50/30' : ''}`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800 flex items-center gap-2">
                          {isOverdue && <AlertTriangle size={14} className="text-rose-500" />}
                          {deadline.title}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">{deadline.deadline_type}</div>
                      </td>
                      <td className="px-6 py-4">
                        {deadline.case_number ? (
                          <>
                            <div className="font-medium text-slate-700">{deadline.case_number}</div>
                            <div className="text-xs text-slate-500 mt-0.5 truncate max-w-[150px]">{deadline.client_name}</div>
                          </>
                        ) : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700">
                        {deadline.assigned_user_name || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`font-semibold ${isOverdue ? 'text-rose-600' : 'text-slate-700'}`}>
                          {fmtDate(deadline.due_date)}
                        </div>
                        {deadline.status !== 'Completed' && (
                          <div className={`text-xs mt-0.5 ${isOverdue ? 'text-rose-500 font-medium' : 'text-slate-500'}`}>
                            {isOverdue ? `${Math.abs(daysLeft)} days overdue` : daysLeft === 0 ? 'Due today' : `${daysLeft} days left`}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                          deadline.priority === 'High' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          deadline.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            deadline.priority === 'High' ? 'bg-rose-500' :
                            deadline.priority === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                          }`} />
                          {deadline.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                          deadline.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          deadline.status === 'Cancelled' ? 'bg-slate-100 text-slate-700 border-slate-200' :
                          isOverdue ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {deadline.status === 'Completed' ? 'Completed' : deadline.status === 'Cancelled' ? 'Cancelled' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <ChevronRight size={18} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0" />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateDeadlineModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchDeadlines}
      />

      <DeadlineDrawer
        deadline={selectedDeadline}
        onClose={() => setSelectedDeadline(null)}
        onUpdate={fetchDeadlines}
        onEdit={(d) => {
          setSelectedDeadline(null);
          // For simplicity, we just use CreateDeadlineModal for both,
          // but we haven't built full edit form support into CreateDeadlineModal yet.
          // Leaving Edit functionality minimal for this iteration as requested.
        }}
      />
    </div>
  );
}
