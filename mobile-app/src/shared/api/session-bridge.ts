type SessionExpiredHandler = () => Promise<void>;

let onSessionExpired: SessionExpiredHandler | null = null;

/**
 * Cầu nối một chiều để `shared/api` báo phiên chết mà không phải import ngược
 * vào `features/auth` (sẽ tạo vòng phụ thuộc).
 */
export function setSessionExpiredHandler(
  handler: SessionExpiredHandler | null
): void {
  onSessionExpired = handler;
}

export async function notifySessionExpired(): Promise<void> {
  await onSessionExpired?.();
}
