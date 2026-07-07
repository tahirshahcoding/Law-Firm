'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';
import { Users, Shield, Plus, X, Trash2, Key, Edit2, Upload, ToggleLeft, ToggleRight, ChevronDown } from 'lucide-react';
import { API_BASE, apiFetch } from '@/lib/api';
import { TableSkeleton } from '@/components/SkeletonLoaders';

// ── Permission Definition ─────────────────────────────────────────────────────
const MODULES = [
  {
    key: 'clients',
    label: 'Clients',
    actions: [
      { key: 'view',   label: 'View' },
      { key: 'add',    label: 'Add' },
      { key: 'edit',   label: 'Edit' },
      { key: 'delete', label: 'Delete' },
    ],
  },
  {
    key: 'cases',
    label: 'Cases',
    actions: [
      { key: 'view',   label: 'View' },
      { key: 'add',    label: 'Add' },
      { key: 'edit',   label: 'Edit' },
      { key: 'delete', label: 'Delete' },
    ],
  },
  {
    key: 'hearings',
    label: 'Hearings',
    actions: [
      { key: 'view',   label: 'View' },
      { key: 'add',    label: 'Add' },
      { key: 'edit',   label: 'Edit' },
      { key: 'delete', label: 'Delete' },
    ],
  },
  {
    key: 'accounts',
    label: 'Accounts',
    actions: [
      { key: 'view',   label: 'View' },
      { key: 'add',    label: 'Add' },
      { key: 'edit',   label: 'Edit' },
      { key: 'delete', label: 'Delete' },
    ],
  },
  {
    key: 'diary',
    label: 'Daily Diary',
    actions: [
      { key: 'view',   label: 'View' },
      { key: 'add',    label: 'Add' },
      { key: 'edit',   label: 'Edit' },
      { key: 'delete', label: 'Delete' },
    ],
  },
  {
    key: 'cause_list',
    label: 'Cause List',
    actions: [
      { key: 'view',   label: 'View' },
      { key: 'print',  label: 'Print' },
    ],
  },
  {
    key: 'consultations',
    label: 'Consultations',
    actions: [
      { key: 'view',   label: 'View' },
      { key: 'edit',   label: 'Update Status' },
      { key: 'delete', label: 'Delete' },
    ],
  },
];

// ── Default permissions per role preset ──────────────────────────────────────
type PermModule = { view: boolean; add: boolean; edit: boolean; delete: boolean; print: boolean };
type Permissions = Record<string, Partial<PermModule>>;

function buildFullPermissions(overrides: Permissions): Permissions {
  const base: Permissions = {};
  MODULES.forEach(m => {
    const actionsObj: any = {};
    m.actions.forEach(a => {
      actionsObj[a.key] = false;
    });
    base[m.key] = actionsObj;
  });
  Object.entries(overrides).forEach(([mod, perms]) => {
    base[mod] = { ...base[mod], ...perms };
  });
  return base;
}

const ROLE_PRESETS: Record<string, Permissions> = {
  Manager: buildFullPermissions({
    clients:       { view: true, add: true, edit: true, delete: false },
    cases:         { view: true, add: true, edit: true, delete: false },
    hearings:      { view: true, add: true, edit: true, delete: false },
    accounts:      { view: true, add: true, edit: true, delete: false },
    diary:         { view: true, add: true, edit: true, delete: true },
    cause_list:    { view: true, print: true },
    consultations: { view: true, edit: true, delete: false },
  }),
  'Senior Partner': buildFullPermissions({
    clients:       { view: true, add: true, edit: true, delete: true },
    cases:         { view: true, add: true, edit: true, delete: true },
    hearings:      { view: true, add: true, edit: true, delete: true },
    accounts:      { view: true, add: true, edit: true, delete: true },
    diary:         { view: true, add: true, edit: true, delete: true },
    cause_list:    { view: true, print: true },
    consultations: { view: true, edit: true, delete: true },
  }),
  Associate: buildFullPermissions({
    clients:       { view: true },
    cases:         { view: true, edit: true },
    hearings:      { view: true, add: true, edit: true },
    diary:         { view: true, add: true, edit: true, delete: true },
    cause_list:    { view: true, print: true },
    consultations: { view: true },
  }),
  Accountant: buildFullPermissions({
    accounts:      { view: true, add: true, edit: true, delete: false },
    consultations: { view: true },
  }),
  Staff: buildFullPermissions({
    clients:       { view: true },
    cases:         { view: true },
    hearings:      { view: true },
    diary:         { view: true, add: true, edit: true, delete: true },
    cause_list:    { view: true, print: true },
    consultations: { view: true },
  }),
  Admin: buildFullPermissions({
    clients:       { view: true, add: true, edit: true, delete: true },
    cases:         { view: true, add: true, edit: true, delete: true },
    hearings:      { view: true, add: true, edit: true, delete: true },
    accounts:      { view: true, add: true, edit: true, delete: true },
    diary:         { view: true, add: true, edit: true, delete: true },
    cause_list:    { view: true, print: true },
    consultations: { view: true, edit: true, delete: true },
  }),
};

const EMPTY_PERMISSIONS = buildFullPermissions({});

// ── Role badge colors ─────────────────────────────────────────────────────────
const ROLE_COLORS: Record<string, string> = {
  Admin:           'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Senior Partner':'bg-purple-50 text-purple-700 border-purple-200',
  Manager:         'bg-blue-50 text-blue-700 border-blue-200',
  Associate:       'bg-emerald-50 text-emerald-700 border-emerald-200',
  Accountant:      'bg-amber-50 text-amber-700 border-amber-200',
  Staff:           'bg-slate-100 text-slate-600 border-slate-200',
};

// ── Toggle Switch component ───────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${
        checked ? 'bg-blue-600' : 'bg-slate-200'
      }`}
      aria-pressed={checked}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? 'translate-x-4' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

// ── Permissions Matrix component ──────────────────────────────────────────────
function PermissionsMatrix({
  permissions,
  onChange,
  disabled,
}: {
  permissions: Permissions;
  onChange: (perms: Permissions) => void;
  disabled?: boolean;
}) {
  const toggle = (module: string, action: string) => {
    if (disabled) return;
    const updated = {
      ...permissions,
      [module]: {
        ...permissions[module],
        [action]: !(permissions[module]?.[action as keyof PermModule]),
      },
    };
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      {MODULES.map(mod => (
        <div key={mod.key} className="bg-slate-50/70 rounded-xl border border-slate-100 px-4 py-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <span className="text-sm font-semibold text-slate-700 min-w-[110px]">{mod.label}</span>
            <div className="flex flex-wrap items-center gap-4">
              {mod.actions.map(action => (
                <div key={action.key} className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    {action.label}
                  </span>
                  <Toggle
                    checked={!!(permissions[mod.key]?.[action.key as keyof PermModule])}
                    onChange={() => toggle(mod.key, action.key)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function UserManagementPage() {
  const { user } = useAuth();
  const { confirm, toast } = useUI();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    email: '',
    role: 'Manager',
    permissions: ROLE_PRESETS['Manager'],
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/users/admin/`);
      if (res.ok) setUsers(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'Admin') fetchUsers();
  }, [user]);

  const resetForm = () => {
    setFormData({
      username: '', password: '', first_name: '', last_name: '', email: '',
      role: 'Manager',
      permissions: ROLE_PRESETS['Manager'],
    });
    setAvatarFile(null);
    setAvatarPreview(null);
    setIsEditMode(false);
    setSelectedUserId(null);
  };

  const handleOpenAddModal = () => { resetForm(); setIsModalOpen(true); };

  const handleOpenEditModal = (u: any) => {
    const savedPerms = u.permissions && Object.keys(u.permissions).length > 0
      ? buildFullPermissions(u.permissions)
      : (ROLE_PRESETS[u.role] || EMPTY_PERMISSIONS);

    setFormData({
      username: u.username,
      password: '',
      first_name: u.first_name || '',
      last_name: u.last_name || '',
      email: u.email || '',
      role: u.role || 'Staff',
      permissions: savedPerms,
    });
    setAvatarPreview(u.avatar || null);
    setAvatarFile(null);
    setIsEditMode(true);
    setSelectedUserId(u.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number, name: string) => {
    const ok = await confirm({
      title: 'Delete Staff Account',
      message: `This will permanently delete the account for "${name}". This action cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      const res = await apiFetch(`${API_BASE}/users/admin/${id}/`, { method: 'DELETE' });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed'); }
      toast.success(`User "${name}" has been deleted.`);
      fetchUsers();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setAvatarFile(e.target.files[0]);
      setAvatarPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  // When role changes, auto-fill the permissions matrix with the preset
  const handleRoleChange = (newRole: string) => {
    setFormData(prev => ({
      ...prev,
      role: newRole,
      permissions: ROLE_PRESETS[newRole] || EMPTY_PERMISSIONS,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = isEditMode ? `${API_BASE}/users/admin/${selectedUserId}/` : `${API_BASE}/users/admin/`;
      const method = isEditMode ? 'PUT' : 'POST';
      let res;

      if (isEditMode) {
        const data = new FormData();
        data.append('username', formData.username);
        if (formData.password) data.append('password', formData.password);
        data.append('first_name', formData.first_name);
        data.append('last_name', formData.last_name);
        data.append('email', formData.email);
        data.append('role', formData.role);
        data.append('permissions', JSON.stringify(formData.permissions));
        if (avatarFile) data.append('avatar', avatarFile);
        res = await apiFetch(url, { method, body: data });
      } else {
        res = await apiFetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData }),
        });
      }

      if (res.ok) {
        fetchUsers();
        setIsModalOpen(false);
        resetForm();
        toast.success(isEditMode ? 'Staff account updated.' : 'Staff account created.');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to save user');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Summary of active permissions for table display
  const permissionSummary = (perms: Permissions) => {
    if (!perms || Object.keys(perms).length === 0) return [];
    return MODULES
      .filter(m => Object.values(perms[m.key] || {}).some(Boolean))
      .map(m => m.label);
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
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm font-medium"
        >
          <Plus size={18} /> Add Staff
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-slate-100 overflow-hidden">
        {loading ? (
          <TableSkeleton />
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Module Access</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u: any) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {u.avatar ? (
                        <img src={u.avatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-100">
                          {u.first_name ? u.first_name[0] : u.username[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-slate-900">
                          {u.first_name} {u.last_name}
                          <span className="text-slate-400 font-normal ml-1">@{u.username}</span>
                        </p>
                        <p className="text-xs text-slate-500">{u.email || 'No email provided'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${ROLE_COLORS[u.role] || ROLE_COLORS['Staff']}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {u.role === 'Admin' ? (
                      <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100 flex items-center gap-1 w-fit">
                        <Key size={12} /> Full Access
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {permissionSummary(u.permissions).length > 0 ? (
                          permissionSummary(u.permissions).map(mod => (
                            <span key={mod} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                              {mod}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">No access</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenEditModal(u)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Edit">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete(u.id, u.username)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Delete">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modal ──────────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200 mb-6">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <Shield size={20} className="text-blue-600" />
                {isEditMode ? 'Edit Staff Account' : 'Create New Staff Account'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white p-1.5 rounded-full hover:bg-slate-100 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Avatar */}
              {isEditMode && (
                <div className="flex justify-center">
                  <div className="relative group cursor-pointer">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-slate-50 shadow-sm bg-slate-100 flex items-center justify-center">
                      {avatarPreview
                        ? <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                        : <Users size={28} className="text-slate-300" />}
                    </div>
                    <label className="absolute inset-0 bg-slate-900/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                      <Upload size={18} className="text-white" />
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    </label>
                  </div>
                </div>
              )}

              {/* Basic Info */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Account Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                    <input type="text" required value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                    <input type="text" required value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Username <span className="text-red-500">*</span></label>
                    <input type="text" required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {isEditMode ? 'New Password' : 'Password'} {!isEditMode && <span className="text-red-500">*</span>}
                    </label>
                    <input type="password" required={!isEditMode} placeholder={isEditMode ? 'Leave blank to keep current' : ''} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                </div>
              </div>

              {/* Role Preset */}
              <div className="border-t border-slate-100 pt-5">
                <div className="flex items-start justify-between mb-3 gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Role Preset</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Selecting a role auto-fills the permission matrix below. You can then customize any toggle individually.</p>
                  </div>
                  <select
                    value={formData.role}
                    onChange={e => handleRoleChange(e.target.value)}
                    className="shrink-0 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  >
                    <option value="Admin">Admin (Full Access)</option>
                    <option value="Senior Partner">Senior Partner</option>
                    <option value="Manager">Manager</option>
                    <option value="Associate">Associate</option>
                    <option value="Accountant">Accountant</option>
                    <option value="Staff">General Staff</option>
                  </select>
                </div>
              </div>

              {/* Permissions Matrix — hidden for Admin (always full access) */}
              {formData.role !== 'Admin' && (
                <div className="border-t border-slate-100 pt-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield size={15} className="text-blue-600" />
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Granular Permissions</h4>
                  </div>
                  <PermissionsMatrix
                    permissions={formData.permissions}
                    onChange={perms => setFormData(prev => ({ ...prev, permissions: perms }))}
                  />
                </div>
              )}

              {formData.role === 'Admin' && (
                <div className="border-t border-slate-100 pt-5">
                  <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                    <Key size={18} className="text-indigo-600 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-indigo-800">Full System Access</p>
                      <p className="text-xs text-indigo-600 mt-0.5">Admins have unrestricted access to all modules and cannot be restricted via the permission matrix.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="border-t border-slate-100 pt-5 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm flex items-center gap-2">
                  <Plus size={16} /> {isEditMode ? 'Save Changes' : 'Create Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
