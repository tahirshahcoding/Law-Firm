'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Users, Shield, Plus, X, Trash2, Key } from 'lucide-react';
import { API_BASE, apiFetch } from '@/lib/api';

export default function UserManagementPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    email: '',
    role: 'Staff',
    permissions: {
      manage_cases: false,
      manage_accounts: false,
      manage_clients: false
    }
  });

  const fetchUsers = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/users/admin/`);
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'Admin') {
      fetchUsers();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch(`${API_BASE}/users/admin/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        fetchUsers();
        setIsModalOpen(false);
        setFormData({
          username: '', password: '', first_name: '', last_name: '', email: '', role: 'Staff',
          permissions: { manage_cases: false, manage_accounts: false, manage_clients: false }
        });
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to create user');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (user?.role !== 'Admin') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Shield size={48} className="text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-700">Access Denied</h2>
        <p className="text-slate-500">You must be an administrator to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 w-full">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Staff Management</h2>
          <p className="text-slate-500 mt-1">Manage office staff, roles, and granular access permissions.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={18} /> Add Staff
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center"><div className="w-8 h-8 border-4 border-slate-100 border-t-blue-500 rounded-full animate-spin"></div></div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Permissions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u: any) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                        {u.first_name ? u.first_name[0] : u.username[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{u.first_name} {u.last_name} <span className="text-slate-400 font-normal ml-1">@{u.username}</span></p>
                        <p className="text-xs text-slate-500">{u.email || 'No email provided'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${u.role === 'Admin' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-700'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {u.role === 'Admin' ? (
                        <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100 flex items-center gap-1"><Key size={12}/> Full Access</span>
                      ) : (
                        <>
                          {u.permissions?.manage_cases && <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">Cases</span>}
                          {u.permissions?.manage_clients && <span className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-100">Clients</span>}
                          {u.permissions?.manage_accounts && <span className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-100">Accounts</span>}
                          {!u.permissions?.manage_cases && !u.permissions?.manage_clients && !u.permissions?.manage_accounts && <span className="text-xs text-slate-400">Read Only</span>}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <Shield size={20} className="text-blue-600" /> Create New Staff Account
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors bg-white p-1.5 rounded-full hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                  <input type="text" required value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                  <input type="text" required value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Username <span className="text-red-500">*</span></label>
                  <input type="text" required value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password <span className="text-red-500">*</span></label>
                  <input type="password" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <h4 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Access Permissions</h4>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors has-[:checked]:bg-blue-50 has-[:checked]:border-blue-200">
                    <input type="checkbox" checked={formData.permissions.manage_cases} onChange={(e) => setFormData({...formData, permissions: {...formData.permissions, manage_cases: e.target.checked}})} className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-600" />
                    <div>
                      <p className="text-sm font-bold text-slate-900">Manage Cases & Hearings</p>
                      <p className="text-xs text-slate-500">Allow user to view, create, edit, and delete legal cases and calendar hearings.</p>
                    </div>
                  </label>
                  
                  <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors has-[:checked]:bg-blue-50 has-[:checked]:border-blue-200">
                    <input type="checkbox" checked={formData.permissions.manage_clients} onChange={(e) => setFormData({...formData, permissions: {...formData.permissions, manage_clients: e.target.checked}})} className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-600" />
                    <div>
                      <p className="text-sm font-bold text-slate-900">Manage Clients</p>
                      <p className="text-xs text-slate-500">Allow user to add new clients, update profiles, and view client history.</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors has-[:checked]:bg-blue-50 has-[:checked]:border-blue-200">
                    <input type="checkbox" checked={formData.permissions.manage_accounts} onChange={(e) => setFormData({...formData, permissions: {...formData.permissions, manage_accounts: e.target.checked}})} className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-600" />
                    <div>
                      <p className="text-sm font-bold text-slate-900">Manage Financials & Invoicing</p>
                      <p className="text-xs text-slate-500">Allow user to access the ledger, view total revenues, add payments, and generate PDFs.</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm flex items-center gap-2">
                  <Plus size={16} /> Create Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
