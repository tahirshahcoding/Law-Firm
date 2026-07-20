'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useUI } from '@/context/UIContext';

export default function AppearanceSettingsPage() {
  const { toast } = useUI();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Check if dark mode is already active
    if (document.documentElement.classList.contains('dark')) {
      setTheme('dark');
    }
  }, []);

  const toggleTheme = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      toast.success('Dark mode enabled');
    } else {
      document.documentElement.classList.remove('dark');
      toast.success('Light mode enabled');
    }
    // Save to local storage
    localStorage.setItem('theme', newTheme);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 w-full">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight transition-colors">Appearance</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1 transition-colors">Customize the interface theme.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors">
        <div className="p-8 space-y-6">
          
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 uppercase tracking-wider transition-colors">Theme Preference</h3>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Light Mode Button */}
              <button 
                onClick={() => toggleTheme('light')}
                className={`flex flex-col items-center justify-center p-6 border-2 rounded-xl transition-all ${
                  theme === 'light' 
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/20' 
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900'
                }`}
              >
                <div className={`p-3 rounded-full mb-3 ${theme === 'light' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                  <Sun size={24} />
                </div>
                <span className={`font-semibold ${theme === 'light' ? 'text-blue-900 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>Light Mode</span>
              </button>

              {/* Dark Mode Button */}
              <button 
                onClick={() => toggleTheme('dark')}
                className={`flex flex-col items-center justify-center p-6 border-2 rounded-xl transition-all ${
                  theme === 'dark' 
                    ? 'border-blue-600 bg-slate-900 dark:bg-slate-800' 
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900'
                }`}
              >
                <div className={`p-3 rounded-full mb-3 ${theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-slate-800 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
                  <Moon size={24} />
                </div>
                <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-700 dark:text-slate-300'}`}>Dark Mode</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
