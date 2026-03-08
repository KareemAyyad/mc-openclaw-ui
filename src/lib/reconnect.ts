/**
 * Shared reconnect backoff utility.
 * Used by SSE, Gateway WebSocket, and OpenClaw client for consistent reconnection behavior.
 */

export const MAX_RECONNECT_DELAY = 60000; // 60 seconds max

/**
 * Calculate reconnect delay with exponential backoff and jitter.
 * @param attempt - Current reconnect attempt number (1-based)
 * @param maxDelay - Maximum delay in ms (default: 60000)
 * @returns Delay in ms with jitter applied
 */
export function calculateReconnectDelay(attempt: number, maxDelay: number = MAX_RECONNECT_DELAY): number {
  const baseDelay = Math.min(5000 * Math.pow(2, attempt - 1), maxDelay);
  return baseDelay + Math.random() * 1000; // jitter to prevent thundering herd
}
