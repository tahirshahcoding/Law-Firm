'use client';

/**
 * UIContext — Global confirm dialog + toast notification system.
 *
 * Usage:
 *   const { confirm, toast } = useUI();
 *
 *   // Confirmation dialog
 *   const ok = await confirm({
 *     title: 'Delete Client',
 *     message: 'This will permanently remove the client record.',
 *     confirmLabel: 'Delete',      // default: 'Confirm'
 *     variant: 'danger',           // 'danger' | 'warning' | 'default'
 *   });
 *   if (!ok) return;
 *
 *   // Toast notifications
 *   toast.success('Client deleted successfully.');
 *   toast.error('Something went wrong.');
 *   toast.info('Record updated.');
 *   toast.warning('Changes may affect linked records.');
 */

import React, {
  createContext, useContext, useRef, useState, useCallback,
  ReactNode,
} from 'react';
import {
  AlertTriangle, Trash2, CheckCircle2, XCircle, Info,
  AlertCircle, X, ShieldAlert,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Variant = 'danger' | 'warning' | 'default';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: Variant;
}

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface UIContextValue {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
    warning: (message: string) => void;
  };
  showLoading: (message?: string) => void;
  hideLoading: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

const UIContext = createContext<UIContextValue | null>(null);

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used inside <UIProvider>');
  return ctx;
}

// ─────────────────────────────────────────────────────────────────────────────
// Variant config
// ─────────────────────────────────────────────────────────────────────────────

const variantConfig: Record<Variant, {
  icon: React.ReactNode;
  iconBg: string;
  confirmBtn: string;
}> = {
  danger: {
    icon: <Trash2 size={22} className="text-rose-500" />,
    iconBg: 'bg-rose-50 border border-rose-100',
    confirmBtn: 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500/30 text-white',
  },
  warning: {
    icon: <ShieldAlert size={22} className="text-amber-500" />,
    iconBg: 'bg-amber-50 border border-amber-100',
    confirmBtn: 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-500/30 text-white',
  },
  default: {
    icon: <AlertCircle size={22} className="text-blue-500" />,
    iconBg: 'bg-blue-50 border border-blue-100',
    confirmBtn: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-[0_4px_12px_rgba(37,99,235,0.25)] hover:shadow-[0_6px_16px_rgba(37,99,235,0.35)] hover:-translate-y-0.5 focus:ring-blue-500/30',
  },
};

const toastConfig: Record<ToastType, {
  icon: React.ReactNode;
  bar: string;
  bg: string;
  text: string;
}> = {
  success: {
    icon: <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />,
    bar: 'bg-emerald-500',
    bg: 'bg-white',
    text: 'text-slate-800',
  },
  error: {
    icon: <XCircle size={18} className="text-rose-500 shrink-0" />,
    bar: 'bg-rose-500',
    bg: 'bg-white',
    text: 'text-slate-800',
  },
  info: {
    icon: <Info size={18} className="text-blue-500 shrink-0" />,
    bar: 'bg-blue-500',
    bg: 'bg-white',
    text: 'text-slate-800',
  },
  warning: {
    icon: <AlertTriangle size={18} className="text-amber-500 shrink-0" />,
    bar: 'bg-amber-500',
    bg: 'bg-white',
    text: 'text-slate-800',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Sound Engine
// ─────────────────────────────────────────────────────────────────────────────

class SoundEngine {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  private beep(freq1: number, freq2: number, type: OscillatorType, duration: number, vol: number) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = type;
    osc.frequency.setValueAtTime(freq1, now);
    if (freq2 !== freq1) {
      osc.frequency.exponentialRampToValueAtTime(freq2, now + duration * 0.8);
    }

    // Low-pass filter for a softer, warmer tone
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1500, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + duration);

    // Smooth ADSR envelope
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol, now + duration * 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }

  play(type: string) {
    this.init();
    if (!this.ctx) return;
    
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (type === 'success') {
      // Gentle, uplifting double chime (A4 -> C#5)
      this.beep(440, 440, 'sine', 0.2, 0.1);
      setTimeout(() => this.beep(554.37, 554.37, 'sine', 0.4, 0.1), 120);
    } else if (type === 'error' || type === 'danger') {
      // Soft, deep bass thud
      this.beep(200, 100, 'triangle', 0.35, 0.2);
    } else if (type === 'warning') {
      // Subtle double tap
      this.beep(350, 350, 'triangle', 0.15, 0.1);
      setTimeout(() => this.beep(350, 300, 'triangle', 0.3, 0.1), 150);
    } else {
      // Clean, single info chime (C5)
      this.beep(523.25, 523.25, 'sine', 0.4, 0.1);
    }
  }
}

const sounds = new SoundEngine();

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

export function UIProvider({ children }: { children: ReactNode }) {
  // ── Confirm dialog state ─────────────────────────────────────────────────
  const [dialog, setDialog] = useState<(ConfirmOptions & { visible: boolean }) | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setDialog({ ...opts, visible: true });
      sounds.play(opts.variant || 'default');
    });
  }, []);

  const handleConfirm = () => {
    setDialog(null);
    resolveRef.current?.(true);
  };

  const handleCancel = () => {
    setDialog(null);
    resolveRef.current?.(false);
  };

  // ── Toast state ───────────────────────────────────────────────────────────
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, type, message }]);
    sounds.play(type);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const toast = {
    success: (msg: string) => addToast('success', msg),
    error: (msg: string) => addToast('error', msg),
    info: (msg: string) => addToast('info', msg),
    warning: (msg: string) => addToast('warning', msg),
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  const [loadingState, setLoadingState] = useState<{ active: boolean; message: string }>({
    active: false,
    message: 'Processing...',
  });

  const showLoading = useCallback((message = 'Processing...') => {
    setLoadingState({ active: true, message });
  }, []);

  const hideLoading = useCallback(() => {
    setLoadingState(prev => ({ ...prev, active: false }));
  }, []);

  const cfg = dialog ? variantConfig[dialog.variant ?? 'default'] : null;

  return (
    <UIContext.Provider value={{ confirm, toast, showLoading, hideLoading }}>
      {children}

      {/* ── Confirm Dialog ─────────────────────────────────────────────── */}
      {dialog && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={handleCancel}
          />

          {/* Panel */}
          <div className="relative bg-white rounded-2xl shadow-2xl shadow-slate-900/20 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Top accent bar */}
            <div className={`h-1 w-full ${cfg?.confirmBtn.includes('rose') ? 'bg-rose-500' : cfg?.confirmBtn.includes('amber') ? 'bg-amber-500' : 'bg-blue-500'}`} />

            <div className="p-6">
              {/* Icon + title */}
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${cfg?.iconBg}`}>
                  {cfg?.icon}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <h2 id="confirm-title" className="text-base font-bold text-slate-900 leading-snug">
                    {dialog.title}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                    {dialog.message}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                  {dialog.cancelLabel ?? 'Cancel'}
                </button>
                <button
                  onClick={handleConfirm}
                  className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all focus:outline-none focus:ring-2 shadow-sm ${cfg?.confirmBtn}`}
                >
                  {dialog.confirmLabel ?? 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast Stack ────────────────────────────────────────────────── */}
      <div className="fixed bottom-5 right-5 z-[10000] flex flex-col gap-2 w-[320px] pointer-events-none">
        {toasts.map(t => {
          const tc = toastConfig[t.type];
          return (
            <div
              key={t.id}
              className={`${tc.bg} rounded-xl shadow-lg shadow-slate-900/10 border border-slate-100 overflow-hidden pointer-events-auto animate-in slide-in-from-right-4 fade-in duration-300`}
            >
              {/* Progress bar */}
              <div className={`h-0.5 ${tc.bar} animate-[shrink_4s_linear_forwards]`} />
              <div className="flex items-center gap-3 px-4 py-3">
                {tc.icon}
                <p className={`text-sm font-medium flex-1 leading-snug ${tc.text}`}>{t.message}</p>
                <button
                  onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
                  className="text-slate-300 hover:text-slate-500 transition-colors shrink-0"
                >
                  <X size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Loading Overlay ────────────────────────────────────────────── */}
      {loadingState.active && (
        <div className="fixed inset-0 z-[10050] flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-xs text-center scale-95 animate-in zoom-in duration-200">
            <div className="relative w-16 h-16 flex items-center justify-center mb-4">
              {/* Spinning Ring */}
              <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
              <div className="absolute inset-0 border-4 border-t-blue-600 border-r-blue-600/30 border-b-blue-600/10 border-l-blue-600/5 rounded-full animate-spin" />
            </div>
            <p className="text-slate-900 font-semibold text-[15px] tracking-wide leading-snug">
              {loadingState.message}
            </p>
          </div>
        </div>
      )}
    </UIContext.Provider>
  );
}
