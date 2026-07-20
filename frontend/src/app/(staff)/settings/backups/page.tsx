'use client';

import { useState, useEffect, useRef } from 'react';
import { useUI } from '@/context/UIContext';
import { Database, AlertTriangle, Play, RefreshCw, Upload, Lock } from 'lucide-react';
import { API_BASE, apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

type BackupResponse = {
  last_backup: { created_at: string } | null;
};

export default function BackupsSettingsPage() {
  const { toast, showLoading, hideLoading } = useUI();
  const { user } = useAuth();
  
  const [data, setData] = useState<BackupResponse | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');

  const fetchLastBackup = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/system/backup/`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error('Failed to fetch last backup info', error);
    }
  };

  useEffect(() => {
    if (user?.role === 'Admin') {
      fetchLastBackup();
    }
  }, [user]);

  const handleCreateBackup = async () => {
    try {
      showLoading('Generating database backup...');
      const res = await apiFetch(`${API_BASE}/system/backup/?download=true`);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to generate backup');
      }

      // Convert response to a blob and trigger browser download
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Get filename from Content-Disposition if possible, or fallback
      const contentDisposition = res.headers.get('content-disposition');
      let filename = `backup_${new Date().toISOString().split('T')[0]}.json`;
      if (contentDisposition && contentDisposition.includes('filename=')) {
          filename = contentDisposition.split('filename=')[1].replace(/"/g, '');
      }
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Backup downloaded successfully.');
      fetchLastBackup();
    } catch (err: any) {
      toast.error(err.message || 'An error occurred while generating the backup.');
    } finally {
      hideLoading();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setShowPasswordModal(true);
    }
    // Reset input so the same file can be selected again if cancelled
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const confirmRestoreBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !adminPassword) return;

    try {
      setShowPasswordModal(false);
      showLoading('Restoring database from backup... Please wait.');
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('password', adminPassword);

      // Do NOT set Content-Type header when sending FormData
      const res = await apiFetch(`${API_BASE}/system/backup/`, {
        method: 'PUT',
        body: formData,
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to restore backup');
      }

      toast.success('Database restored successfully.');
      setAdminPassword('');
      setSelectedFile(null);
      
      setTimeout(() => {
        window.location.reload(); // Reload to refresh all application state
      }, 1500);
    } catch (err: any) {
      toast.error(err.message || 'An error occurred while restoring the backup.');
      setAdminPassword('');
      setSelectedFile(null);
    } finally {
      hideLoading();
    }
  };

  if (user?.role !== 'Admin') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle size={48} className="text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Admin Only Feature</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">You do not have permission to access system backups.</p>
      </div>
    );
  }

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 w-full">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Backup & Restore</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Download database snapshots and restore the system from backup files.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors">
        
        {/* Last Backup Section */}
        <div className="p-8">
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <p className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Last Backup</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {data?.last_backup ? formatDate(data.last_backup.created_at) : 'Never'}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Status</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                {data?.last_backup ? 'Successful' : 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleCreateBackup}
              className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all shadow-sm flex items-center gap-2"
            >
              Create Backup
            </button>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".json,.sql"
              onChange={handleFileSelect}
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2"
            >
              <Upload size={18} />
              Restore Backup
            </button>
          </div>
        </div>
      </div>

      {/* Password Confirmation Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl dark:shadow-none border border-transparent dark:border-slate-800 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 transition-colors">
            <div className="p-6">
              <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
                <AlertTriangle size={28} className="shrink-0" />
                <h3 className="text-xl font-bold">Critical Warning</h3>
              </div>
              
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Restoring a backup will replace the current live database. This action cannot be undone. All changes made after this backup was created will be permanently lost.
              </p>
              
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-lg p-3 mb-6">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 break-all">
                  File to restore: <span className="font-bold text-slate-900 dark:text-white">{selectedFile?.name}</span>
                </p>
              </div>

              <form onSubmit={confirmRestoreBackup}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Enter Admin Password to Confirm
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock size={18} className="text-slate-400 dark:text-slate-500" />
                    </div>
                    <input
                      type="password"
                      required
                      autoFocus
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Admin password"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setAdminPassword('');
                      setSelectedFile(null);
                    }}
                    className="px-4 py-2 font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!adminPassword}
                    className="px-4 py-2 font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    Confirm & Restore
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
