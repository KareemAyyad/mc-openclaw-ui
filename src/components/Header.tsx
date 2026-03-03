'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Settings, ChevronLeft, LayoutGrid, Cpu, Sun, Moon } from 'lucide-react';
import { useMissionControl } from '@/lib/store';
import { useVisibility, useVisibleInterval } from '@/hooks/useVisibility';
import { useTheme } from '@/hooks/useTheme';
import { format } from 'date-fns';
import type { Workspace } from '@/lib/types';

interface HeaderProps {
  workspace?: Workspace;
  isPortrait?: boolean;
}

export function Header({ workspace, isPortrait = true }: HeaderProps) {
  const router = useRouter();
  const { agents, tasks, isOnline } = useMissionControl();
  const { theme, toggleTheme } = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeSubAgents, setActiveSubAgents] = useState(0);
  const isVisible = useVisibility();

  // Only update clock when tab is visible
  useVisibleInterval(() => setCurrentTime(new Date()), 1000);

  const loadSubAgentCount = useCallback(async () => {
    try {
      const res = await fetch('/api/openclaw/sessions?session_type=subagent&status=active');
      if (res.ok) {
        const sessions = await res.json();
        setActiveSubAgents(sessions.length);
      }
    } catch (error) {
      console.error('Failed to load sub-agent count:', error);
    }
  }, []);

  // Initial load
  useEffect(() => { loadSubAgentCount(); }, [loadSubAgentCount]);

  // Poll only when tab is visible
  useVisibleInterval(loadSubAgentCount, 30000);

  const workingAgents = agents.filter((a) => a.status === 'working').length;
  const activeAgents = workingAgents + activeSubAgents;
  const tasksInQueue = tasks.filter((t) => t.status !== 'done' && t.status !== 'review').length;

  const portraitWorkspaceHeader = !!workspace && isPortrait;

  return (
    <header
      role="banner"
      className={`bg-mc-bg-secondary border-b border-mc-border px-3 md:px-4 ${
        portraitWorkspaceHeader ? 'py-2.5 space-y-2.5' : 'h-14 flex items-center justify-between gap-2'
      }`}
    >
      {portraitWorkspaceHeader ? (
        <>
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <Link href="/" className="flex items-center gap-1 text-mc-text-secondary hover:text-mc-accent transition-colors shrink-0" aria-label="Back to all workspaces">
                <ChevronLeft className="w-4 h-4" />
                <LayoutGrid className="w-4 h-4" />
              </Link>
              <div className="flex items-center gap-2 px-2.5 py-1.5 bg-mc-bg-tertiary rounded min-w-0">
                <span className="text-base" role="img" aria-label="Workspace icon">{workspace.icon}</span>
                <span className="font-medium truncate text-sm">{workspace.name}</span>
              </div>
            </div>

            <button onClick={toggleTheme} className="min-h-11 min-w-11 p-2 hover:bg-mc-bg-tertiary rounded-lg text-mc-text-secondary shrink-0 transition-colors" title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} aria-label="Toggle theme">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button onClick={() => router.push('/settings')} className="min-h-11 min-w-11 p-2 hover:bg-mc-bg-tertiary rounded-lg text-mc-text-secondary shrink-0 transition-colors" title="Settings" aria-label="Open settings">
              <Settings className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <div
              role="status"
              aria-label={isOnline ? 'System online' : 'System offline'}
              className={`flex items-center gap-2 px-3 min-h-11 rounded-lg border text-xs font-medium ${
                isOnline
                  ? 'bg-mc-accent-green/15 border-mc-accent-green/40 text-mc-accent-green'
                  : 'bg-mc-accent-red/15 border-mc-accent-red/40 text-mc-accent-red'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-mc-accent-green animate-pulse' : 'bg-mc-accent-red'}`} />
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </div>

            <div className="flex-1 grid grid-cols-2 gap-2">
              <div className="min-h-11 rounded-lg border border-mc-border bg-mc-bg-tertiary px-2 flex items-center justify-center gap-1.5 text-xs" aria-label={`${activeAgents} active agents`}>
                <span className="text-mc-accent-cyan font-semibold">{activeAgents}</span>
                <span className="text-mc-text-secondary">active</span>
              </div>
              <div className="min-h-11 rounded-lg border border-mc-border bg-mc-bg-tertiary px-2 flex items-center justify-center gap-1.5 text-xs" aria-label={`${tasksInQueue} queued tasks`}>
                <span className="text-mc-accent-purple font-semibold">{tasksInQueue}</span>
                <span className="text-mc-text-secondary">queued</span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <Link href="/" className="hidden sm:flex items-center gap-2.5 group" aria-label="Teammates.ai home">
              <div className="w-7 h-7 rounded-lg tm-gradient flex items-center justify-center shadow-glow-sm">
                <Cpu className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-mc-text text-sm tracking-tight">
                Teammates<span className="text-tm-brand">.ai</span>
              </span>
            </Link>

            {workspace ? (
              <div className="flex items-center gap-2 min-w-0">
                <Link href="/" className="hidden sm:flex items-center gap-1 text-mc-text-secondary hover:text-mc-accent transition-colors" aria-label="All workspaces">
                  <ChevronLeft className="w-4 h-4" />
                  <LayoutGrid className="w-4 h-4" />
                </Link>
                <span className="hidden sm:block text-mc-text-secondary/50">/</span>
                <div className="flex items-center gap-2 px-2 md:px-3 py-1 bg-mc-bg-tertiary rounded-lg min-w-0">
                  <span className="text-base md:text-lg" role="img" aria-label="Workspace icon">{workspace.icon}</span>
                  <span className="font-medium truncate text-sm md:text-base">{workspace.name}</span>
                </div>
              </div>
            ) : (
              <Link href="/" className="flex items-center gap-2 px-3 py-1 bg-mc-bg-tertiary rounded-lg hover:bg-mc-bg transition-colors">
                <LayoutGrid className="w-4 h-4" />
                <span className="text-sm">All Workspaces</span>
              </Link>
            )}
          </div>

          {workspace && (
            <div className="hidden lg:flex items-center gap-6" role="group" aria-label="Workspace metrics">
              <div className="flex items-center gap-2.5 px-3 py-1.5 bg-mc-bg-tertiary/50 rounded-lg border border-mc-border/50">
                <div className="w-2 h-2 rounded-full bg-mc-accent-cyan animate-pulse-soft" />
                <span className="text-lg font-bold text-mc-accent-cyan tabular-nums">{activeAgents}</span>
                <span className="text-xs text-mc-text-secondary uppercase tracking-wide">Teammates Active</span>
              </div>
              <div className="flex items-center gap-2.5 px-3 py-1.5 bg-mc-bg-tertiary/50 rounded-lg border border-mc-border/50">
                <span className="text-lg font-bold text-mc-accent-purple tabular-nums">{tasksInQueue}</span>
                <span className="text-xs text-mc-text-secondary uppercase tracking-wide">In Queue</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 md:gap-3">
            <span className="hidden md:block text-mc-text-secondary text-sm font-mono tabular-nums">{format(currentTime, 'HH:mm:ss')}</span>
            <div
              role="status"
              aria-label={isOnline ? 'System online' : 'System offline'}
              className={`flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-lg border text-xs md:text-sm font-medium ${
                isOnline
                  ? 'bg-mc-accent-green/15 border-mc-accent-green/40 text-mc-accent-green'
                  : 'bg-mc-accent-red/15 border-mc-accent-red/40 text-mc-accent-red'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-mc-accent-green animate-pulse' : 'bg-mc-accent-red'}`} />
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </div>
            <button onClick={toggleTheme} className="min-h-11 min-w-11 p-2 hover:bg-mc-bg-tertiary rounded-lg text-mc-text-secondary transition-colors" title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} aria-label="Toggle theme">
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button onClick={() => router.push('/settings')} className="min-h-11 min-w-11 p-2 hover:bg-mc-bg-tertiary rounded-lg text-mc-text-secondary transition-colors" title="Settings" aria-label="Open settings">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </>
      )}
    </header>
  );
}
