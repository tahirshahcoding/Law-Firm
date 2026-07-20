'use client';

import { useState, useEffect } from 'react';
import { Printer, Search, Calendar, MapPin, Scale, Gavel, FileText, RefreshCw, Layers, Shield } from 'lucide-react';
import { API_BASE, apiFetch } from '@/lib/api';
import { TableSkeleton } from '@/components/SkeletonLoaders';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export default function CauseListPage() {
  const { user } = useAuth();
  const [hearings, setHearings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [district, setDistrict] = useState('');
  const [tehsil, setTehsil] = useState('');
  const [court, setCourt] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    // Return local date formatted as YYYY-MM-DD
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - (offset * 60 * 1000));
    return localToday.toISOString().split('T')[0];
  });

  const canView = user?.role === 'Admin' || user?.permissions?.cause_list?.view === true;
  const canPrint = user?.role === 'Admin' || user?.permissions?.cause_list?.print === true;

  const fetchCauseList = () => {
    if (!canView) return;
    setLoading(true);
    let url = `${API_BASE}/hearings/?date=${selectedDate}`;
    if (district.trim()) url += `&district=${encodeURIComponent(district.trim())}`;
    if (tehsil.trim()) url += `&tehsil=${encodeURIComponent(tehsil.trim())}`;
    if (court.trim()) url += `&court=${encodeURIComponent(court.trim())}`;

    apiFetch(url)
      .then(res => res.json())
      .then(data => {
        const results = Array.isArray(data) ? data : (data.results || []);
        setHearings(results);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch cause list:', err);
        toast.error('Failed to load cause list data');
        setLoading(false);
      });
  };

  useEffect(() => {
    if (canView) {
      fetchCauseList();
    }
  }, [selectedDate, user]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCauseList();
  };

  const handleClearFilters = () => {
    setDistrict('');
    setTehsil('');
    setCourt('');
    // Trigger fetch after clearing filters in next tick or set direct state
    setTimeout(() => {
      if (!canView) return;
      setLoading(true);
      apiFetch(`${API_BASE}/hearings/?date=${selectedDate}`)
        .then(res => res.json())
        .then(data => {
          setHearings(Array.isArray(data) ? data : (data.results || []));
          setLoading(false);
        });
    }, 0);
  };

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 transition-colors">
          <Shield size={32} className="text-slate-300 dark:text-slate-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Access Denied</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">You don't have permission to view the Cause List.</p>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  };

  // Group hearings by stage/class
  const groupHearings = (list: any[]) => {
    const groups: { [key: string]: any[] } = {};
    list.forEach((h: any) => {
      const stage = h.hearing_stage ? h.hearing_stage.trim() : 'Miscellaneous';
      const normalizedStage = stage.charAt(0).toUpperCase() + stage.slice(1);
      if (!groups[normalizedStage]) {
        groups[normalizedStage] = [];
      }
      groups[normalizedStage].push(h);
    });
    return groups;
  };

  const groupedHearings = groupHearings(hearings);

  // Logical sorting order for common stages
  const orderedStages = [
    'Attendance',
    'Written Statement',
    'Issues',
    'Framing of Charge',
    'Evidence',
    'Arguments',
    'Final Arguments',
    'Judgment',
    'Miscellaneous'
  ];

  const sortedGroupKeys = Object.keys(groupedHearings).sort((a, b) => {
    const indexA = orderedStages.indexOf(a);
    const indexB = orderedStages.indexOf(b);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.localeCompare(b);
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 print-container w-full">
      
      {/* ── Print-only Header ── */}
      <div className="hidden print:block text-center mb-6 pt-4">
        <h1 className="text-2xl font-bold uppercase tracking-wider text-black font-serif">Rahimullah Advocate</h1>
        <h2 className="text-lg font-bold uppercase text-black mt-1 font-serif">Court Cause List</h2>
        <div className="text-sm font-semibold text-black mt-3 font-serif">
          Date: {formatDate(selectedDate)}
        </div>
        <hr className="mt-5 border-black border-t-2" />
      </div>

      {/* ── Page Header (Screen only) ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Gavel className="text-blue-600 dark:text-blue-400" /> Court Cause List
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm sm:text-base">Search, filter, and print the firm's classified daily hearings list.</p>
        </div>
        {canPrint && (
          <button
            onClick={handlePrint}
            disabled={hearings.length === 0}
            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-medium transition-all duration-200 shadow-sm flex items-center justify-center gap-2"
          >
            <Printer size={18} /> Print Cause List
          </button>
        )}
      </div>

      {/* ── Filter Form (Screen only) ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] dark:shadow-none border border-slate-100 dark:border-slate-800 p-5 no-print transition-colors">
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* Date Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Calendar size={13} /> Date
              </label>
              <input
                type="date"
                required
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-slate-700 dark:text-slate-300"
              />
            </div>

            {/* District Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <MapPin size={13} /> District (Optional)
              </label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="e.g. Swat"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium text-slate-900 dark:text-white"
              />
            </div>

            {/* Tehsil Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <MapPin size={13} /> Tehsil (Optional)
              </label>
              <input
                type="text"
                value={tehsil}
                onChange={(e) => setTehsil(e.target.value)}
                placeholder="e.g. Kabal"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium text-slate-900 dark:text-white"
              />
            </div>

            {/* Court Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Scale size={13} /> Court Branch (Optional)
              </label>
              <input
                type="text"
                value={court}
                onChange={(e) => setCourt(e.target.value)}
                placeholder="e.g. Civil Judge"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium text-slate-900 dark:text-white"
              />
            </div>

          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-50 dark:border-slate-800">
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              * Leave District, Tehsil, and Court empty to see all hearings for the selected date.
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleClearFilters}
                className="flex-1 sm:flex-none border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <RefreshCw size={14} /> Reset
              </button>
              <button
                type="submit"
                className="flex-1 sm:flex-none bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 duration-300 shadow-[0_4px_12px_rgba(37,99,235,0.25)] hover:shadow-[0_6px_16px_rgba(37,99,235,0.35)] hover:-translate-y-0.5 px-5 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 text-white"
              >
                <Search size={14} /> Search
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ── Cause List Content ── */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 no-print transition-colors">
          <TableSkeleton />
        </div>
      ) : hearings.length === 0 ? (
        <div className="bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 px-6 py-16 text-center print:border-solid print:border print:bg-white print:py-8 transition-colors">
          <div className="w-12 h-12 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-full flex items-center justify-center mb-3 mx-auto shadow-sm no-print">
            <Layers className="text-slate-400 dark:text-slate-500" size={20} />
          </div>
          <p className="text-slate-900 dark:text-white font-bold text-lg mb-1">No Hearings Scheduled</p>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">
            {selectedDate === new Date().toISOString().split('T')[0]
              ? "There are no hearings scheduled for today matching these filters."
              : `There are no hearings scheduled for ${formatDate(selectedDate)} matching these filters.`}
          </p>
        </div>
      ) : (
        <div className="space-y-8 print:space-y-0">
          {sortedGroupKeys.map((stageKey) => {
            const stageHearings = groupedHearings[stageKey];
            return (
              <div key={stageKey} className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_2px_8px_-3px_rgba(6,81,237,0.03)] dark:shadow-none border border-slate-100/80 dark:border-slate-800 overflow-hidden print:shadow-none print:border-none print:rounded-none print:table-container transition-colors">
                
                {/* Stage Section Header */}
                <div className="px-5 py-3.5 bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between print:px-3 print:py-2.5 print:bg-white print:p-2.5 print:mb-0 print-group-header transition-colors">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2 print:text-black print:font-serif print:text-[13px] print:font-bold print:uppercase">
                    <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400 no-print" />
                    {stageKey} ({stageHearings.length})
                  </h3>
                </div>

                {/* Table list */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-slate-200 dark:border-slate-700 print:table">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 text-xs font-bold uppercase tracking-wider print:bg-slate-100 print:text-black print:border-black">
                        <th className="px-4 py-3.5 text-center border border-slate-200 dark:border-slate-700 print:border-black w-[5%] font-bold">S.No</th>
                        <th className="px-4 py-3.5 text-center border border-slate-200 dark:border-slate-700 print:border-black w-[12%] whitespace-nowrap font-bold">Case ID</th>
                        <th className="px-4 py-3.5 text-center border-slate-200 dark:border-slate-700 print:border-black w-[15%] whitespace-nowrap font-bold">Case No</th>
                        <th className="px-4 py-3.5 text-center border border-slate-200 dark:border-slate-700 print:border-black w-[28%] font-bold">Title</th>
                        <th className="px-4 py-3.5 text-center border border-slate-200 dark:border-slate-700 print:border-black w-[15%] font-bold">Advocates</th>
                        <th className="px-4 py-3.5 text-center border border-slate-200 dark:border-slate-700 print:border-black w-[13%] font-bold">Proceedings</th>
                        <th className="px-4 py-3.5 text-center border border-slate-200 dark:border-slate-700 print:border-black w-[12%] whitespace-nowrap font-bold">Prev Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50 print:divide-y print:divide-black">
                      {stageHearings.map((h: any, index: number) => (
                        <tr key={h.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/50 transition-colors text-sm print:hover:bg-transparent print:border-black">
                          {/* S.No */}
                          <td className="px-4 py-3.5 text-center text-slate-500 dark:text-slate-400 font-medium border border-slate-200 dark:border-slate-700 print:text-black print:border-black">
                            {index + 1}
                          </td>
                          {/* Case ID */}
                          <td className="px-4 py-3.5 text-center font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 print:text-black print:border-black font-mono whitespace-nowrap">
                            {h.client_number || '—'}
                          </td>
                          {/* Case No */}
                          <td className="px-4 py-3.5 text-center font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 print:text-black print:border-black whitespace-nowrap">
                            {h.case_number}
                          </td>
                          {/* Title */}
                          <td className="px-4 py-3.5 text-center border border-slate-200 dark:border-slate-700 print:text-black print:border-black leading-relaxed">
                            <div className="font-semibold text-slate-800 dark:text-slate-200 print:text-black">{h.client_name || 'Client'}</div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase print:text-slate-600 my-0.5">vs</div>
                            <div className="font-semibold text-slate-800 dark:text-slate-200 print:text-black">{h.opponent_name}</div>
                          </td>
                          {/* Advocates */}
                          <td className="px-4 py-3.5 text-center border border-slate-200 dark:border-slate-700 print:text-black print:border-black font-semibold text-slate-700 dark:text-slate-300">
                            {h.advocate_name || 'Senior Partner'}
                          </td>
                          {/* Proceedings */}
                          <td className="px-4 py-3.5 text-center border border-slate-200 dark:border-slate-700 print:text-black print:border-black text-blue-600 dark:text-blue-400 font-semibold">
                            {h.hearing_stage}
                          </td>
                          {/* Prev Date */}
                          <td className="px-4 py-3.5 text-center border border-slate-200 dark:border-slate-700 print:text-black print:border-black font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {h.previous_date ? formatDate(h.previous_date) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ── Embedded Print stylesheet ── */}
      <style jsx global>{`
        @media print {
          /* Force margins and layout setup */
          @page {
            size: A4 portrait;
            margin: 20mm 15mm 20mm 15mm;
          }
          body {
            background-color: white !important;
            color: black !important;
            font-family: "Times New Roman", Times, Georgia, serif !important;
            font-size: 11px !important;
            line-height: 1.4 !important;
          }
          /* Hide screen-only components completely */
          .no-print, aside, header, nav, button, footer, .toaster {
            display: none !important;
          }
          /* Reset container styling for page printout */
          .print-container {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          /* Grid table styling */
          .print-table-container {
            margin-top: 20px !important;
            page-break-inside: avoid !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-family: "Times New Roman", Times, Georgia, serif !important;
            margin-top: 0px !important;
            margin-bottom: 25px !important;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          th, td {
            border: 1.5px solid #000000 !important;
            padding: 10px 8px !important;
            text-align: center !important;
            vertical-align: middle !important;
            font-size: 11px !important;
            color: black !important;
          }
          th {
            background-color: #f3f4f6 !important;
            font-weight: bold !important;
            text-transform: uppercase !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          /* Group header printed as block banner */
          .print-group-header {
            border: 1.5px solid #000000 !important;
            border-bottom: none !important;
            padding: 10px 12px !important;
            font-weight: bold !important;
            text-transform: uppercase !important;
            margin-top: 25px !important;
            background-color: white !important;
            font-family: "Times New Roman", Times, Georgia, serif !important;
            font-size: 13px !important;
            color: black !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}
