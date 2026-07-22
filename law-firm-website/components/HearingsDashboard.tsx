"use client";

import { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, MapPin, Search } from 'lucide-react';

interface Hearing {
  id: string;
  case_title: string;
  court_name: string;
  judge: string;
  date: string;
  time: string | null;
  status: string;
}

const TABS = ['upcoming', 'today', 'tomorrow', 'past', 'all'];

export default function HearingsDashboard() {
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [search, setSearch] = useState('');

  const fetchHearings = async (timeframe: string) => {
    setLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/';
      // Handle the 'all' tab case for the timeframe logic in the backend 
      // where 'all' might not be a specific keyword, we can just omit it or map it.
      // Our backend supports today, tomorrow, yesterday, last_7, next_7, upcoming, past.
      const param = timeframe === 'all' ? '' : `?timeframe=${timeframe}`;
      const url = `${baseUrl}api/public/hearings/${param}`;
      
      const res = await fetch(url);
      
      if (!res.ok) {
        console.warn(`API returned ${res.status}: ${res.statusText}`);
        setHearings([]);
        return;
      }
      
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.warn("API did not return JSON. Returning empty list.");
        setHearings([]);
        return;
      }

      const data = await res.json();
      if (data && data.results) {
        setHearings(data.results);
      } else {
        setHearings([]);
      }
    } catch (error) {
      console.error("Failed to fetch public hearings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHearings(activeTab);
  }, [activeTab]);

  const filteredHearings = hearings.filter(h => 
    h.case_title.toLowerCase().includes(search.toLowerCase()) || 
    h.court_name.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return {
      day: d.getDate(),
      month: d.toLocaleString('default', { month: 'short' }).toUpperCase(),
      year: d.getFullYear()
    };
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return 'TBD';
    const [h, m] = timeStr.split(':');
    let hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour}:${m} ${ampm}`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'decided':
      case 'disposed':
      case 'closed':
        return 'bg-green-100 text-green-700';
      case 'adjourned':
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      case 'pending':
      case 'attendance':
      case 'arguments':
      case 'evidence':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  return (
    <div className="w-full">
      {/* Hearings List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-2xl font-serif font-bold text-navy">Public Cause List</h2>
          
          <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
             <input 
               type="text" 
               placeholder="Search cases..." 
               className="pl-9 pr-4 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:border-gold w-full sm:w-64"
               value={search}
               onChange={(e) => setSearch(e.target.value)}
             />
          </div>
        </div>
        
        <div className="px-6 border-b border-slate-100 flex gap-6 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 text-sm font-semibold capitalize whitespace-nowrap border-b-2 transition-colors ${activeTab === tab ? 'border-gold text-gold' : 'border-transparent text-slate-500 hover:text-navy'}`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-4 min-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-gold rounded-full animate-spin"></div>
            </div>
          ) : filteredHearings.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p>No hearings found for this timeframe.</p>
            </div>
          ) : (
            filteredHearings.map(hearing => {
              const { day, month, year } = formatDate(hearing.date);
              return (
                <div key={hearing.id} className="flex flex-col sm:flex-row items-center border-b border-slate-100 hover:bg-slate-50 transition-colors bg-white py-3 px-4">
                  {/* Date Block */}
                  <div className="flex flex-col items-center justify-center sm:border-r border-slate-100 min-w-[80px] shrink-0 sm:pr-4 mb-2 sm:mb-0">
                    <span className="text-2xl font-bold text-navy leading-none">{day}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{month}, {year}</span>
                    <span className="mt-1 text-[10px] font-semibold text-gold bg-gold/10 px-1.5 py-0.5 rounded">{formatTime(hearing.time)}</span>
                  </div>
                  
                  {/* Info Block */}
                  <div className="flex-grow sm:px-4 w-full text-center sm:text-left">
                    <h3 className="text-base font-bold text-navy mb-1">{hearing.case_title}</h3>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-slate-600">
                      <div className="flex items-center justify-center sm:justify-start gap-1">
                        <MapPin size={12} className="text-gold shrink-0" />
                        <span className="font-medium">{hearing.court_name}</span>
                      </div>
                      <div className="text-slate-400">
                        Judge: <span className="text-slate-500 font-medium">{hearing.judge}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Status Block */}
                  <div className="shrink-0 mt-2 sm:mt-0 px-2">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(hearing.status)}`}>
                      {hearing.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
