'use client';

import { useState, useEffect } from 'react';
import { Activity, Clock, User, ShieldAlert, FileText, FileDown, Eye, FileSignature } from 'lucide-react';
import { API_BASE, apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { TableSkeleton } from '@/components/SkeletonLoaders';

export default function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user && !['Admin', 'Senior Partner'].includes(user.role || '')) {
      window.location.href = '/';
      return;
    }

    setLoading(true);
    apiFetch(`${API_BASE}/audit-log/`)
      .then(res => res.json())
      .then(data => {
        setLogs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch audit logs:', err);
        setLoading(false);
      });
  }, [user]);

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'created': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'updated': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'deleted': return 'text-rose-600 bg-rose-50 border-rose-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getModelIcon = (modelName: string) => {
    switch (modelName.toLowerCase()) {
      case 'case': return <FileText size={16} className="text-blue-500" />;
      case 'hearing': return <Eye size={16} className="text-purple-500" />;
      case 'invoice': return <FileSignature size={16} className="text-emerald-500" />;
      default: return <FileDown size={16} className="text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="text-rose-500" />
            System Audit Log
          </h2>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">Record of all system activities. Visible only to Admins.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-slate-100 overflow-hidden">
        {loading ? (
          <TableSkeleton />
        ) : logs.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-500">
            <Activity className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <p className="text-slate-900 font-medium mb-1">No activity logged yet</p>
            <p className="text-sm">Modifications to records will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Entity</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-1/3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log: any, idx: number) => (
                  <tr key={`${log.id}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600 font-mono">
                        <Clock size={14} className="text-slate-400" />
                        {new Date(log.date).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-[10px]">
                          {(log.user || 'S').charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-slate-900">{log.user}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getModelIcon(log.model)}
                        <span className="text-sm font-medium text-slate-700">{log.model}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600">{log.details}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
