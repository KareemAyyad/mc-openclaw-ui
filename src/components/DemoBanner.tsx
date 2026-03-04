'use client';

import { useEffect, useState } from 'react';

export default function DemoBanner() {
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    fetch('/api/demo')
      .then(r => r.json())
      .then(data => setIsDemo(data.demo))
      .catch(() => {});
  }, []);

  if (!isDemo) return null;

  return (
    <div
      role="status"
      aria-label="Demo mode active"
      className="tm-gradient text-white text-center py-2.5 px-4 text-sm font-medium z-50 relative"
    >
      <span className="inline-flex items-center gap-2">
        <span className="w-2 h-2 bg-white rounded-full animate-pulse" aria-hidden="true" />
        Live Demo — AI teammates are working in real-time. This is a read-only simulation.
      </span>
      <a
        href="https://github.com/crshdn/mission-control"
        target="_blank"
        rel="noopener noreferrer"
        className="ml-3 underline hover:text-white/80 transition-colors font-semibold"
      >
        Get Teammates.ai →
      </a>
    </div>
  );
}
