'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[WorkspaceError] Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-mc-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-mc-bg-secondary border border-mc-border rounded-lg p-6 text-center">
        <div className="text-4xl mb-4">&#x26A0;&#xFE0F;</div>
        <h2 className="text-lg font-semibold text-mc-text mb-2">Workspace Error</h2>
        <p className="text-sm text-mc-text-secondary mb-4">
          Failed to load this workspace. The data may be temporarily unavailable.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-mc-accent text-mc-bg rounded text-sm font-medium hover:bg-mc-accent/90"
          >
            Retry
          </button>
          <Link
            href="/"
            className="px-4 py-2 bg-mc-bg-tertiary text-mc-text rounded text-sm hover:bg-mc-border"
          >
            All Workspaces
          </Link>
        </div>
      </div>
    </div>
  );
}
