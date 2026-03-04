'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, Activity, Clock, Filter, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { AgentAvatar } from '@/components/AgentAvatar';
import type { Agent, Event, Task, Workspace } from '@/lib/types';

type ActivityFilter = 'all' | 'working' | 'blocked' | 'idle';

interface AgentActivityDashboardProps {
  workspace?: Workspace | null;
}

export function AgentActivityDashboard({ workspace }: AgentActivityDashboardProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const [isPortrait, setIsPortrait] = useState(true);
  const [sseConnected, setSseConnected] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const workspaceId = workspace?.id;

  useEffect(() => {
    const media = window.matchMedia('(orientation: portrait)');
    const update = () => setIsPortrait(media.matches);
    update();
    media.addEventListener('change', update);
    window.addEventListener('resize', update);
    return () => {
      media.removeEventListener('change', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const [agentsRes, tasksRes, eventsRes] = await Promise.all([
          fetch(workspaceId ? `/api/agents?workspace_id=${workspaceId}` : '/api/agents'),
          fetch(workspaceId ? `/api/tasks?workspace_id=${workspaceId}` : '/api/tasks'),
          fetch('/api/events?limit=150'),
        ]);

        if (!mounted) return;

        if (agentsRes.ok) setAgents(await agentsRes.json());
        if (tasksRes.ok) setTasks(await tasksRes.json());
        if (eventsRes.ok) setEvents(await eventsRes.json());
      } catch (error) {
        console.error('Failed to load activity dashboard data:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [workspaceId]);

  useEffect(() => {
    const refresh = async () => {
      try {
        const [agentsRes, tasksRes, eventsRes] = await Promise.all([
          fetch(workspaceId ? `/api/agents?workspace_id=${workspaceId}` : '/api/agents'),
          fetch(workspaceId ? `/api/tasks?workspace_id=${workspaceId}` : '/api/tasks'),
          fetch('/api/events?limit=150'),
        ]);

        if (agentsRes.ok) setAgents(await agentsRes.json());
        if (tasksRes.ok) setTasks(await tasksRes.json());
        if (eventsRes.ok) setEvents(await eventsRes.json());
      } catch (error) {
        console.error('Failed to refresh activity dashboard data:', error);
      }
    };

    const startPolling = () => {
      if (pollingIntervalRef.current) return;
      pollingIntervalRef.current = setInterval(refresh, 20000);
    };

    const stopPolling = () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };

    const connectSSE = () => {
      const source = new EventSource('/api/events/stream');
      eventSourceRef.current = source;

      source.onopen = () => {
        setSseConnected(true);
        stopPolling();
      };

      source.onmessage = (event) => {
        if (event.data.startsWith(':')) return;
        refresh();
      };

      source.onerror = () => {
        setSseConnected(false);
        source.close();
        eventSourceRef.current = null;
        startPolling();
      };
    };

    connectSSE();
    startPolling();

    return () => {
      eventSourceRef.current?.close();
      stopPolling();
    };
  }, [workspaceId]);

  const activeTasks = useMemo(
    () => tasks.filter((task) => task.status !== 'done' && task.status !== 'review'),
    [tasks]
  );

  const blockedAgentIds = useMemo(() => {
    const ids = new Set<string>();

    for (const task of tasks) {
      if (!task.assigned_agent_id) continue;
      if (task.status === 'testing' || task.status === 'review') {
        ids.add(task.assigned_agent_id);
      }
    }

    for (const agent of agents) {
      if (agent.status === 'offline') {
        const hasAssignedActiveTask = tasks.some(
          (task) => task.assigned_agent_id === agent.id && task.status !== 'done'
        );
        if (hasAssignedActiveTask) ids.add(agent.id);
      }
    }

    return ids;
  }, [agents, tasks]);

  const nowWorking = useMemo(() => {
    return agents
      .filter((agent) => agent.status === 'working')
      .map((agent) => {
        const currentTask = tasks.find(
          (task) => task.assigned_agent_id === agent.id && (task.status === 'in_progress' || task.status === 'assigned' || task.status === 'testing')
        );
        return { agent, currentTask };
      });
  }, [agents, tasks]);

  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      if (filter === 'all') return true;
      if (filter === 'working') return agent.status === 'working';
      if (filter === 'blocked') return blockedAgentIds.has(agent.id);
      if (filter === 'idle') return agent.status === 'standby' || agent.status === 'offline';
      return true;
    });
  }, [agents, blockedAgentIds, filter]);

  const eventsByAgent = useMemo(() => {
    const map = new Map<string, Event[]>();
    for (const event of events) {
      if (!event.agent_id) continue;
      const list = map.get(event.agent_id) ?? [];
      list.push(event);
      map.set(event.agent_id, list);
    }
    return map;
  }, [events]);

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-mc-bg flex items-center justify-center p-4">
        <div className="text-mc-text-secondary animate-pulse text-sm">Loading activity dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-mc-bg pb-[env(safe-area-inset-bottom)]">
      <header className="sticky top-0 z-30 border-b border-white/5 bg-black/60 backdrop-blur-md px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <Link href={workspace ? `/workspace/${workspace.slug}` : '/'} className="p-2 hover:bg-white/10 rounded-xl text-mc-text-secondary hover:text-mc-text transition-colors shadow-none border-0 bg-transparent flex items-center justify-center shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-mc-text truncate">Agent Activity Dashboard</h1>
              <p className="text-xs sm:text-sm text-mc-text-secondary truncate mt-0.5">
                {workspace ? `${workspace.icon} ${workspace.name}` : 'All workspaces'} <span className="mx-1.5 opacity-50">•</span> {sseConnected ? 'Live (SSE)' : 'Polling fallback'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div className={`px-3 py-1.5 min-h-11 rounded-lg border text-xs sm:text-sm font-medium flex items-center gap-2 transition-all ${sseConnected ? 'text-mc-accent-green border-mc-accent-green/40 bg-mc-accent-green/10 shadow-[0_0_15px_rgba(34,197,94,0.2)]' : 'text-mc-accent-yellow border-mc-accent-yellow/40 bg-mc-accent-yellow/10'}`}>
              <RefreshCw className={`w-4 h-4 ${sseConnected ? 'animate-spin-slow' : ''}`} />
              <span className="hidden sm:inline">{sseConnected ? 'LIVE' : 'FALLBACK'}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        <section className={`grid ${isPortrait ? 'grid-cols-2' : 'grid-cols-4'} gap-4`}>
          <MetricCard label="Agents" value={String(agents.length)} />
          <MetricCard label="Working" value={String(agents.filter((a) => a.status === 'working').length)} />
          <MetricCard label="Blocked" value={String(blockedAgentIds.size)} />
          <MetricCard label="Active Tasks" value={String(activeTasks.length)} />
        </section>

        <section className="glass-panel rounded-2xl p-5 sm:p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg bg-mc-accent-cyan/10 border border-mc-accent-cyan/20 flex items-center justify-center">
              <Activity className="w-4 h-4 text-mc-accent-cyan" />
            </div>
            <h2 className="text-lg font-semibold text-mc-text">Now Working</h2>
          </div>
          {nowWorking.length === 0 ? (
            <div className="text-sm text-mc-text-secondary/70 italic">No agents currently marked as working.</div>
          ) : (
            <div className="space-y-3">
              {nowWorking.map(({ agent, currentTask }) => (
                <div key={agent.id} className="border border-white/5 rounded-xl p-4 bg-white/[0.02] hover:bg-white/[0.04] transition-colors min-h-11 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center filter drop-shadow shrink-0">
                      <AgentAvatar avatar={agent.avatar_emoji} className="w-5 h-5 text-mc-accent-cyan" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-sm text-mc-text truncate">{agent.name}</div>
                      <div className="text-xs text-mc-text-secondary truncate mt-0.5">{currentTask?.title || 'No active task linked'}</div>
                    </div>
                  </div>
                  <div className="text-xs text-mc-text-secondary/60 whitespace-nowrap flex items-center gap-1.5 bg-black/40 px-2.5 py-1.5 rounded-lg border border-white/5 w-fit">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDistanceToNow(new Date(currentTask?.updated_at || agent.updated_at), { addSuffix: true })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex flex-wrap items-center gap-2 mb-6 p-1.5 bg-black/40 border border-white/5 rounded-xl w-fit">
            <div className="px-3 flex items-center justify-center border-r border-white/10 mr-1">
              <Filter className="w-4 h-4 text-mc-text-secondary" />
            </div>
            {(['all', 'working', 'blocked', 'idle'] as ActivityFilter[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`min-h-9 px-5 rounded-lg text-sm font-medium capitalize transition-all duration-300 ${filter === tab ? 'bg-mc-accent-cyan text-black shadow-[0_0_15px_rgba(34,211,238,0.3)]' : 'text-mc-text-secondary hover:text-mc-text hover:bg-white/5'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {filteredAgents.map((agent) => {
              const agentTimeline = (eventsByAgent.get(agent.id) || []).slice(0, 5);
              const isBlocked = blockedAgentIds.has(agent.id);

              return (
                <article key={agent.id} className="glass-panel rounded-2xl p-5 sm:p-6 transition-all hover:bg-white/[0.04]">
                  <div className="flex items-start justify-between gap-4 mb-5 pb-5 border-b border-white/5">
                    <div className="flex gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center filter drop-shadow shrink-0">
                        <AgentAvatar avatar={agent.avatar_emoji} className="w-6 h-6 text-mc-accent-cyan" />
                      </div>
                      <div className="min-w-0 flex flex-col justify-center">
                        <div className="font-semibold text-mc-text text-base truncate">{agent.name}</div>
                        <div className="text-xs text-mc-text-secondary uppercase tracking-wider truncate mt-1">{agent.role}</div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 flex flex-col items-end justify-center">
                      <span className={`text-[10px] sm:text-xs px-2.5 py-1 rounded inline-block uppercase tracking-wider font-medium ${agent.status === 'working' ? 'status-working' : agent.status === 'offline' ? 'status-offline' : 'status-standby'}`}>
                        {agent.status}
                      </span>
                      <div className="text-[10px] text-mc-text-secondary/60 mt-2">Updated {formatDistanceToNow(new Date(agent.updated_at), { addSuffix: true })}</div>
                    </div>
                  </div>

                  {isBlocked && (
                    <div className="mb-5 p-3 rounded-xl border border-mc-accent-red/30 bg-mc-accent-red/10 text-mc-accent-red text-sm flex items-center gap-2.5 shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      Blocked indicator: waiting in testing/review or offline with assigned work
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="text-[10px] font-medium uppercase tracking-widest text-mc-text-secondary/50 flex items-center gap-2">
                      <span>Timeline</span>
                      <div className="h-px flex-1 bg-white/5" />
                    </div>
                    {agentTimeline.length === 0 ? (
                      <div className="text-xs text-mc-text-secondary/60 italic py-2">No recent activity for this agent.</div>
                    ) : (
                      <div className="space-y-2">
                        {agentTimeline.map((event) => (
                          <div key={event.id} className="rounded-xl border border-white/5 bg-black/20 hover:bg-black/40 transition-colors px-3 py-2.5 min-h-11 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="text-sm text-mc-text/90 leading-snug">{event.message}</div>
                            <div className="text-[10px] text-mc-text-secondary/60 shrink-0 bg-white/5 px-2 py-1 rounded-md w-fit">{formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 min-h-24 flex flex-col justify-between hover:bg-white/[0.04] transition-colors group">
      <div className="text-[10px] sm:text-xs font-medium uppercase tracking-widest text-mc-text-secondary group-hover:text-mc-accent-cyan transition-colors">{label}</div>
      <div className="text-2xl sm:text-4xl font-light text-mc-text mt-2 tracking-tight">{value}</div>
    </div>
  );
}
