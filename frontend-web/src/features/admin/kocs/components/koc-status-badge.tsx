import type { KocStatus } from '../types';
import { CREATOR_ACCOUNT_STATES } from '../creator-domain';

const STATUS_CONFIG: Record<
  KocStatus,
  { label: string; className: string; dot: string }
> = {
  active: {
    label: CREATOR_ACCOUNT_STATES.active.label,
    className: 'bg-emerald-500/15 text-emerald-700',
    dot: 'bg-emerald-600',
  },
  pending: {
    label: CREATOR_ACCOUNT_STATES.pending.label,
    className: 'bg-amber-400/25 text-amber-800',
    dot: 'bg-amber-600',
  },
  banned: {
    label: CREATOR_ACCOUNT_STATES.banned.label,
    className: 'bg-slate-500/15 text-slate-700',
    dot: 'bg-slate-600',
  },
  suspended: {
    label: CREATOR_ACCOUNT_STATES.suspended.label,
    className: 'bg-rose-500/15 text-rose-600',
    dot: 'bg-rose-600',
  },
};

export function KocStatusBadge({ status }: { status: KocStatus }) {
  const conf = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold tracking-wide ${conf.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${conf.dot}`} />
      {conf.label}
    </span>
  );
}
