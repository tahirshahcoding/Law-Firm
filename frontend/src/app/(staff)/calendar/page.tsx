'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Search, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Filter, Layers, List, AlignLeft } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { API_BASE, apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { TableSkeleton } from '@/components/SkeletonLoaders';
import useSWR from 'swr';
import { swrFetcher } from '@/lib/fetcher';

import { MonthlyView, WeeklyView, DailyView, AgendaView } from './components/CalendarViews';
import { EventDetailsModal } from './components/EventDetailsModal';
import { AddManualEventModal } from './components/AddManualEventModal';

export interface CalendarEvent {
  id: string;
  title: string;
  event_type: string;
  start_date: string;
  end_date: string | null;
  all_day: boolean;
  description: string | null;
  location: string | null;
  case: string | null;
  client: string | null;
  case_number: string | null;
  client_name: string | null;
  advocate_name: string | null;
  court_name: string | null;
  judge_name: string | null;
}

type ViewMode = 'month' | 'week' | 'day' | 'agenda';

function CalendarPageContent() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  const [filterType, setFilterType] = useState<string>('');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Determine the required range based on the current date
  const reqStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1).toISOString();
  const reqEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0).toISOString();

  const query = new URLSearchParams({
    start: reqStart,
    end: reqEnd,
    limit: '1000'
  });
  
  if (debouncedSearchTerm) query.append('search', debouncedSearchTerm);
  if (filterType) query.append('event_type', filterType);

  const url = `${API_BASE}/calendar-events/?${query.toString()}`;
  const { data: rawEvents, isLoading: loading, mutate: fetchEvents } = useSWR(url, swrFetcher);

  const events = Array.isArray(rawEvents?.results) ? rawEvents.results : (Array.isArray(rawEvents) ? rawEvents : []);

  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') d.setMonth(d.getMonth() - 1);
    else if (viewMode === 'week') d.setDate(d.getDate() - 7);
    else if (viewMode === 'day') d.setDate(d.getDate() - 1);
    else d.setMonth(d.getMonth() - 1); // Agenda scrolls by month
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') d.setMonth(d.getMonth() + 1);
    else if (viewMode === 'week') d.setDate(d.getDate() + 7);
    else if (viewMode === 'day') d.setDate(d.getDate() + 1);
    else d.setMonth(d.getMonth() + 1); // Agenda scrolls by month
    setCurrentDate(d);
  };

  const handleToday = () => setCurrentDate(new Date());

  const renderView = () => {
    if (loading) return <TableSkeleton />;

    switch (viewMode) {
      case 'month':
        return <MonthlyView 
                  currentDate={currentDate} 
                  events={events} 
                  onEventClick={setSelectedEvent} 
                  onDateClick={(d) => { setCurrentDate(d); setViewMode('day'); }}
                />;
      case 'week':
        return <WeeklyView currentDate={currentDate} events={events} onEventClick={setSelectedEvent} />;
      case 'day':
        return <DailyView currentDate={currentDate} events={events} onEventClick={setSelectedEvent} />;
      case 'agenda':
        return <AgendaView events={events} onEventClick={setSelectedEvent} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Calendar</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm sm:text-base">Centralized view of all hearings, deadlines, and meetings.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium transition-all duration-300 shadow-[0_4px_12px_rgba(37,99,235,0.25)] hover:shadow-[0_6px_16px_rgba(37,99,235,0.35)] hover:-translate-y-0.5 flex items-center justify-center gap-2"
        >
          <Plus size={18} /> Schedule Event
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_4px_24px_-8px_rgba(59,130,246,0.08)] dark:shadow-none border border-blue-100/50 dark:border-slate-800 p-4 flex flex-col xl:flex-row items-center justify-between gap-4 transition-colors">
        
        {/* Navigation & Current Date */}
        <div className="flex items-center gap-4 w-full xl:w-auto">
          <div className="flex items-center gap-1">
            <button onClick={handlePrev} className="p-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
              <ChevronLeft size={18} />
            </button>
            <button onClick={handleToday} className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
              Today
            </button>
            <button onClick={handleNext} className="p-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 min-w-[160px]">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
        </div>

        {/* Filters and View Toggles */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="Search events..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>
          
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 dark:text-slate-300"
          >
            <option value="">All Event Types</option>
            <option value="Court Hearing">Court Hearings</option>
            <option value="Client Meeting">Client Meetings</option>
            <option value="Filing Deadline">Filing Deadlines</option>
            <option value="Payment Due">Payment Dues</option>
            <option value="Internal Task">Internal Tasks</option>
            <option value="Office Event">Office Events</option>
            <option value="Staff Leave">Staff Leave</option>
            <option value="Public Holiday">Public Holidays</option>
          </select>

          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-full sm:w-auto overflow-hidden transition-colors">
            <button 
              onClick={() => setViewMode('month')} 
              className={`flex-1 sm:flex-none px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'month' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-700 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              Month
            </button>
            <button 
              onClick={() => setViewMode('week')} 
              className={`flex-1 sm:flex-none px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'week' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-700 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              Week
            </button>
            <button 
              onClick={() => setViewMode('day')} 
              className={`flex-1 sm:flex-none px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'day' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-700 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              Day
            </button>
            <button 
              onClick={() => setViewMode('agenda')} 
              className={`flex-1 sm:flex-none px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'agenda' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-700 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              Agenda
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_4px_24px_-8px_rgba(59,130,246,0.08)] dark:shadow-none border border-blue-100/50 dark:border-slate-800 p-4 transition-colors">
        {renderView()}
      </div>

      <EventDetailsModal 
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        event={selectedEvent}
        onEventDeleted={() => fetchEvents(true)}
      />

      <AddManualEventModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => fetchEvents(true)}
      />
    </div>
  );
}

export default function CalendarPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <CalendarPageContent />
    </Suspense>
  );
}
