'use client';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  Paid: {
    label: 'Paid',
    className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  },
  Partial: {
    label: 'Partial',
    className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  },
  Unpaid: {
    label: 'Unpaid',
    className: 'bg-slate-100 text-slate-600 dark:text-slate-400 ring-1 ring-slate-200',
  },
  Overdue: {
    label: 'Overdue',
    className: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  },
};

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    className: 'bg-slate-100 text-slate-600 dark:text-slate-400 ring-1 ring-slate-200',
  };

  const sizeClass = size === 'sm'
    ? 'text-xs px-2 py-0.5'
    : 'text-sm px-3 py-1';

  return (
    <span className={`inline-flex items-center rounded-full font-semibold uppercase tracking-wide ${sizeClass} ${config.className}`}>
      {config.label}
    </span>
  );
}
