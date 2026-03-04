/**
 * ActivityLog Component
 * Displays chronological activity log for a task
 */

'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Rocket, Edit3, CheckCircle2, FilePlus2, RefreshCw, FileText, Bot } from 'lucide-react';
import type { TaskActivity } from '@/lib/types';

interface ActivityLogProps {
  taskId: string;
}

export function ActivityLog({ taskId }: ActivityLogProps) {
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const lastCountRef = useRef(0);

  const loadActivities = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);

      const res = await fetch(`/api/tasks/${taskId}/activities`);
      const data = await res.json();

      if (res.ok) {
        setActivities(data);
        lastCountRef.current = data.length;
      }
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  // Initial load
  useEffect(() => {
    loadActivities(true);
  }, [taskId, loadActivities]);

  // Polling function
  const pollForActivities = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/activities`);
      if (res.ok) {
        const data = await res.json();
        // Only update if there are new activities
        if (data.length !== lastCountRef.current) {
          setActivities(data);
          lastCountRef.current = data.length;
        }
      }
    } catch (error) {
      console.error('Polling error:', error);
    }
  }, [taskId]); // setActivities is stable from React, no need to include

  // Poll for new activities every 5 seconds when task is in progress
  useEffect(() => {
    const pollInterval = setInterval(pollForActivities, 5000);

    pollingRef.current = pollInterval;

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [taskId, pollForActivities]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'spawned':
        return <Rocket className="w-5 h-5 text-mc-accent-cyan" />;
      case 'updated':
        return <Edit3 className="w-5 h-5 text-mc-accent-yellow" />;
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-mc-accent-green" />;
      case 'file_created':
        return <FilePlus2 className="w-5 h-5 text-mc-accent-purple" />;
      case 'status_changed':
        return <RefreshCw className="w-5 h-5 text-blue-400" />;
      default:
        return <FileText className="w-5 h-5 text-mc-text-secondary" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-mc-text-secondary">Loading activities...</div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-mc-text-secondary glass-panel rounded-2xl border-dashed">
        <FileText className="w-12 h-12 mb-3 opacity-50" strokeWidth={1.5} />
        <p>No activity yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="flex gap-4 p-4 glass-panel rounded-2xl hover:bg-white/[0.04] transition-colors group"
        >
          {/* Icon */}
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 filter drop-shadow group-hover:scale-110 transition-transform">
            {getActivityIcon(activity.activity_type)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pt-0.5">
            {/* Agent info */}
            {activity.agent && (
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-5 h-5 rounded bg-white/10 flex items-center justify-center filter drop-shadow">
                  <Bot className="w-3.5 h-3.5 text-mc-text-secondary" />
                </div>
                <span className="text-sm font-medium text-mc-text">
                  {activity.agent.name}
                </span>
                <span className="text-xs text-mc-text-secondary px-1.5 py-0.5 rounded bg-white/5 border border-white/10 scale-90 origin-left">
                  Agent
                </span>
              </div>
            )}

            {/* Message */}
            <p className="text-sm text-mc-text break-words leading-relaxed">
              {activity.message}
            </p>

            {/* Metadata */}
            {activity.metadata && (
              <div className="mt-3 p-3 bg-black/40 border border-white/5 rounded-xl text-xs text-mc-text-secondary font-mono overflow-x-auto hide-scrollbar">
                {typeof activity.metadata === 'string'
                  ? activity.metadata
                  : JSON.stringify(JSON.parse(activity.metadata), null, 2)}
              </div>
            )}

            {/* Timestamp */}
            <div className="text-xs text-mc-text-secondary/60 mt-3 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-mc-text-secondary/40" />
              {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
