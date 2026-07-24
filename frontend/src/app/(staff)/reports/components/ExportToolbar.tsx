import React from 'react';
import { Download, FileText } from 'lucide-react';
import { apiFetch, API_BASE } from '@/lib/api';

interface ExportToolbarProps {
  endpoint: string;
  filters: Record<string, any>;
  filename: string;
}

export function ExportToolbar({ endpoint, filters, filename }: ExportToolbarProps) {
  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
      const response = await apiFetch(`${API_BASE}/reports/${endpoint}/export_csv/?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Export failed');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${filename}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('CSV Export Failed', error);
      alert('Failed to export CSV. Please try again or check your permissions.');
    }
  };

  return (
    <div className="flex gap-3 mb-6">
      <button 
        onClick={handleExportCSV}
        className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors border border-slate-200 dark:border-slate-700"
      >
        <FileText size={16} />
        Export CSV
      </button>
      <button 
        className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors border border-slate-200 dark:border-slate-700 opacity-50 cursor-not-allowed"
        title="PDF export via xhtml2pdf is coming shortly"
      >
        <Download size={16} />
        Export PDF
      </button>
    </div>
  );
}
