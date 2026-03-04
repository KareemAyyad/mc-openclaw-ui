/**
 * SessionsList Component
 * Displays OpenClaw sub-agent sessions for a task
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { Bot, CheckCircle, Circle, XCircle, Trash2, Check } from 'lucide-react';

interface SessionWithAgent {
  id: string;
  agent_id: string | null;
  openclaw_session_id: string;
  channel: string | null;
  status: string;
  session_type: string;
  task_id: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
  agent_name?: string;
  agent_avatar_emoji?: string;
}

interface SessionsListProps {
  taskId: string;
}

export function SessionsList({ taskId }: SessionsListProps) {
  const [sessions, setSessions] = useState<SessionWithAgent[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSessions = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/subagent`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Circle className="w-4 h-4 text-green-500 fill-current animate-pulse" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-mc-accent" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Circle className="w-4 h-4 text-mc-text-secondary" />;
    }
  };

  const formatDuration = (start: string, end?: string | null) => {
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : Date.now();
    const duration = endTime - startTime;

    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleMarkComplete = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/openclaw/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          ended_at: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        loadSessions();
      }
    } catch (error) {
      console.error('Failed to mark session complete:', error);
    }
  };

  const handleDelete = async (sessionId: string) => {
    if (!confirm('Delete this sub-agent session?')) return;
    try {
      const res = await fetch(`/api/openclaw/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        loadSessions();
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-mc-text-secondary">Loading sessions...</div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-mc-text-secondary glass-panel rounded-2xl border-dashed">
        <Bot className="w-12 h-12 mb-3 opacity-50 text-mc-accent-cyan" strokeWidth={1.5} />
        <p>No sub-agent sessions yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sessions.map((session) => (
        <div
          key={session.id}
          className="flex gap-4 p-4 glass-panel rounded-2xl hover:bg-white/[0.04] transition-colors group"
        >
          {/* Agent Avatar */}
          <div className="flex-shrink-0 mt-0.5">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center filter drop-shadow group-hover:bg-white/10 transition-colors">
              <Bot className="w-5 h-5 text-mc-accent-cyan" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Agent name and status */}
            <div className="flex items-center gap-2.5 mb-2">
              {getStatusIcon(session.status)}
              <span className="font-medium text-mc-text text-sm">
                {session.agent_name || 'Sub-Agent'}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider bg-white/5 border border-white/10 text-mc-text-secondary">
                {session.status}
              </span>
            </div>

            {/* Session ID */}
            <div className="mt-2 p-3 bg-black/40 border border-white/5 rounded-xl text-xs text-mc-text-secondary font-mono truncate">
              Session: <span className="text-mc-text">{session.openclaw_session_id}</span>
            </div>

            {/* Duration and timestamps */}
            <div className="flex items-center gap-2 mt-3 text-xs text-mc-text-secondary/80">
              <span className="text-mc-accent-purple font-mono bg-mc-accent-purple/10 px-1.5 py-0.5 rounded border border-mc-accent-purple/20">
                {formatDuration(session.created_at, session.ended_at)}
              </span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span>Started {formatTimestamp(session.created_at)}</span>
            </div>

            {/* Channel */}
            {session.channel && (
              <div className="mt-2 text-xs text-mc-text-secondary/80">
                Channel: <span className="font-mono text-mc-text border border-white/5 bg-white/5 px-1.5 py-0.5 rounded ml-1">{session.channel}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity justify-start h-full">
            {session.status === 'active' && (
              <button
                onClick={() => handleMarkComplete(session.openclaw_session_id)}
                className="p-2 hover:bg-mc-accent-green/10 rounded-lg text-mc-accent-green transition-colors"
                title="Mark as complete"
              >
                <Check className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => handleDelete(session.openclaw_session_id)}
              className="p-2 hover:bg-mc-accent-red/10 rounded-lg text-mc-accent-red transition-colors"
              title="Delete session"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
