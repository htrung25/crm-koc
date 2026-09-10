import {
  COLLABORATION_LABELS,
  type CollaborationStatus,
} from '../creator-domain';
export function CollaborationStatusBadge({
  status,
}: {
  status: CollaborationStatus;
}) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${status === 4 ? 'bg-emerald-50 text-emerald-700' : status === 5 || status === 6 ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-800'}`}
    >
      {COLLABORATION_LABELS[status] ?? 'Không xác định'}
    </span>
  );
}
