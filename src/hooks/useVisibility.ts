'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook that tracks browser tab visibility and pauses/resumes intervals.
 * Uses the Page Visibility API to detect when a tab is hidden.
 *
 * @returns An object with `isVisible` state and a `useVisibleInterval` helper.
 */
export function useVisibility() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    function handleVisibilityChange() {
      setIsVisible(document.visibilityState === 'visible');
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return isVisible;
}

/**
 * Hook that runs a callback on an interval, but only when the tab is visible.
 * Automatically pauses when the tab is hidden and resumes when visible.
 *
 * @param callback - Function to call on each interval tick
 * @param delayMs - Interval delay in milliseconds
 * @param enabled - Optional flag to disable the interval entirely
 */
export function useVisibleInterval(
  callback: () => void,
  delayMs: number,
  enabled: boolean = true
) {
  const isVisible = useVisibility();
  const savedCallback = useRef(callback);

  // Update the callback ref on every render
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled || !isVisible) return;

    const tick = () => savedCallback.current();
    const id = setInterval(tick, delayMs);
    return () => clearInterval(id);
  }, [delayMs, enabled, isVisible]);
}
