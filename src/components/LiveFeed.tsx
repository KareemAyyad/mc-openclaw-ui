'use client';

import { useState } from 'react';
import { ChevronRight, ChevronLeft, Clock, PlusCircle, UserCheck, ArrowRightLeft, CheckCircle2, MessageSquare, Zap, Bell, Settings, Circle } from 'lucide-react';
import { useMissionControl } from '@/lib/store';
import type { Event } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

type FeedFilter = 'all' | 'tasks' | 'agents';

interface LiveFeedProps {
  mobileMode?: boolean;
  isPortrait?: boolean;
}

export function LiveFeed({ mobileMode = false, isPortrait = true }: LiveFeedProps) {
  const { events } = useMissionControl();
  const [filter, setFilter] = useState<FeedFilter>('all');
  const [isMinimized, setIsMinimized] = useState(false);

  const effectiveMinimized = mobileMode ? false : isMinimized;
  const toggleMinimize = () => setIsMinimized(!isMinimized);

  const filteredEvents = events.filter((event) => {
    if (filter === 'all') return true;
    if (filter === 'tasks') return ['task_created', 'task_assigned', 'task_status_changed', 'task_completed'].includes(event.type);
    if (filter === 'agents') return ['agent_joined', 'agent_status_changed', 'message_sent'].includes(event.type);
    return true;
  });

  return (
    <aside
      className={`glass-sidebar ${mobileMode ? 'border border-white/5 rounded-lg h-full' : 'border-l border-white/5'} flex flex-col transition-all duration-300 ease-in-out z-10 ${effectiveMinimized ? 'w-12' : mobileMode ? 'w-full' : 'w-80'
        }`}
    >
      <div className="p-3 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center">
          {!mobileMode && (
            <button
              onClick={toggleMinimize}
              className="p-1 rounded hover:bg-mc-bg-tertiary text-mc-text-secondary hover:text-mc-text transition-colors"
              aria-label={effectiveMinimized ? 'Expand feed' : 'Minimize feed'}
            >
              {effectiveMinimized ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          )}
          {!effectiveMinimized && <span className="text-sm font-medium uppercase tracking-wider">Live Feed</span>}
        </div>

        {!effectiveMinimized && (
          <div className={`mt-3 ${mobileMode && isPortrait ? 'grid grid-cols-3 gap-2' : 'flex gap-1'}`}>
            {(['all', 'tasks', 'agents'] as FeedFilter[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`min-h-11 text-xs rounded uppercase transition-colors ${mobileMode && isPortrait ? 'px-1' : 'px-3'} ${filter === tab ? 'bg-mc-accent-cyan/15 text-mc-accent-cyan border border-mc-accent-cyan/30 font-medium' : 'text-mc-text-secondary hover:bg-white/5 border border-transparent'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}
      </div>

      {!effectiveMinimized && (
        <div className="flex-1 overflow-y-auto p-2 space-y-1 pb-[calc(0.5rem+env(safe-area-inset-bottom))] hide-scrollbar">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-8 text-mc-text-secondary text-sm">No events yet</div>
          ) : (
            filteredEvents.map((event) => <EventItem key={event.id} event={event} />)
          )}
        </div>
      )}
    </aside>
  );
}

function EventItem({ event }: { event: Event }) {
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'task_created':
        return <PlusCircle className="w-4 h-4 text-mc-accent-cyan" />;
      case 'task_assigned':
        return <UserCheck className="w-4 h-4 text-mc-accent-purple" />;
      case 'task_status_changed':
        return <ArrowRightLeft className="w-4 h-4 text-mc-accent-yellow" />;
      case 'task_completed':
        return <CheckCircle2 className="w-4 h-4 text-mc-accent-green" />;
      case 'message_sent':
        return <MessageSquare className="w-4 h-4 text-mc-accent-pink" />;
      case 'agent_joined':
        return <Zap className="w-4 h-4 text-mc-accent-cyan" />;
      case 'agent_status_changed':
        return <Bell className="w-4 h-4 text-mc-accent-yellow" />;
      case 'system':
        return <Settings className="w-4 h-4 text-mc-text-secondary" />;
      default:
        return <Circle className="w-4 h-4 text-mc-text-secondary" />;
    }
  };

  const isTaskEvent = ['task_created', 'task_assigned', 'task_completed'].includes(event.type);
  const isHighlight = event.type === 'task_created' || event.type === 'task_completed';

  return (
    <div
      className={`p-3 rounded-xl border-l-2 transition-all hover:bg-white/[0.04] ${isHighlight ? 'bg-white/[0.02] border-mc-accent-cyan/50 shadow-[0_0_15px_rgba(34,211,238,0.05)]' : 'bg-transparent border-transparent hover:border-white/10'
        }`}
    >
      <div className="flex items-start gap-2.5">
        <div className="shrink-0 mt-0.5">{getEventIcon(event.type)}</div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm leading-snug ${isTaskEvent ? 'text-mc-accent-cyan' : 'text-mc-text'}`}>{event.message}</p>
          <div className="flex items-center gap-1 mt-1 text-xs text-mc-text-secondary">
            <Clock className="w-3 h-3" />
            {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
          </div>
        </div>
      </div>
    </div>
  );
}
