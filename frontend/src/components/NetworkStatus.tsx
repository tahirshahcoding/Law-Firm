'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NetworkStatus() {
  // We initialize as true so it doesn't blink red on hydration
  const [isOnline, setIsOnline] = useState(true);
  const [showBackOnline, setShowBackOnline] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowBackOnline(true);
      // Hide the "Back online" message after 3 seconds
      setTimeout(() => setShowBackOnline(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBackOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 bg-rose-600 text-white px-5 py-3 rounded-full shadow-2xl shadow-rose-600/30 font-sans"
        >
          <WifiOff size={18} className="animate-pulse" />
          <span className="font-semibold text-sm tracking-wide">You are currently offline</span>
        </motion.div>
      )}

      {isOnline && showBackOnline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 bg-emerald-600 text-white px-5 py-3 rounded-full shadow-2xl shadow-emerald-600/30 font-sans"
        >
          <Wifi size={18} />
          <span className="font-semibold text-sm tracking-wide">Connection restored!</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
