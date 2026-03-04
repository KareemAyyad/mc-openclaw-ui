'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Zap, Settings, ChevronLeft, LayoutGrid } from 'lucide-react';
import { useMissionControl } from '@/lib/store';
import { format } from 'date-fns';
import type { Workspace } from '@/lib/types';

interface HeaderProps {
  workspace?: Workspace;
  isPortrait?: boolean;
}

export function Header({ workspace, isPortrait = true }: HeaderProps) {
  const router = useRouter();
  const { agents, tasks, isOnline } = useMissionControl();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeSubAgents, setActiveSubAgents] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadSubAgentCount = async () => {
      try {
        const res = await fetch('/api/openclaw/sessions?session_type=subagent&status=active');
        if (res.ok) {
          const sessions = await res.json();
          setActiveSubAgents(sessions.length);
        }
      } catch (error) {
        console.error('Failed to load sub-agent count:', error);
      }
    };

    loadSubAgentCount();
    const interval = setInterval(loadSubAgentCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const workingAgents = agents.filter((a) => a.status === 'working').length;
  const activeAgents = workingAgents + activeSubAgents;
  const tasksInQueue = tasks.filter((t) => t.status !== 'done' && t.status !== 'review').length;

  const portraitWorkspaceHeader = !!workspace && isPortrait;

  return (
    <header
      className={`bg-black/40 backdrop-blur-xl border-b border-white/5 px-3 md:px-4 ${portraitWorkspaceHeader ? 'py-2.5 space-y-2.5' : 'h-14 flex items-center justify-between gap-2'
        }`}
    >
      {portraitWorkspaceHeader ? (
        <>
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <Link href="/" className="flex items-center gap-1 text-mc-text-secondary hover:text-mc-accent transition-colors shrink-0">
                <ChevronLeft className="w-4 h-4" />
                <LayoutGrid className="w-4 h-4" />
              </Link>
              <div className="flex items-center gap-2 px-2.5 py-1.5 bg-mc-bg-tertiary rounded min-w-0">
                <span className="text-base">{workspace.icon}</span>
                <span className="font-medium truncate text-sm">{workspace.name}</span>
              </div>
            </div>

            <button onClick={() => router.push('/settings')} className="min-h-11 min-w-11 p-2 hover:bg-white/10 rounded-lg transition-colors text-mc-text-secondary shrink-0" title="Settings">
              <Settings className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`flex items-center gap-2 px-3 min-h-11 rounded border text-xs font-medium ${isOnline
                ? 'bg-mc-accent-green/20 border-mc-accent-green text-mc-accent-green'
                : 'bg-mc-accent-red/20 border-mc-accent-red text-mc-accent-red'
                }`}
            >
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-mc-accent-green animate-pulse online-glow' : 'bg-mc-accent-red'}`} />
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </div>

            <div className="flex-1 grid grid-cols-2 gap-2">
              <div className="min-h-11 rounded border border-mc-border bg-mc-bg-tertiary px-2 flex items-center justify-center gap-1.5 text-xs">
                <span className="text-mc-accent-cyan font-semibold">{activeAgents}</span>
                <span className="text-mc-text-secondary">active</span>
              </div>
              <div className="min-h-11 rounded border border-mc-border bg-mc-bg-tertiary px-2 flex items-center justify-center gap-1.5 text-xs">
                <span className="text-mc-accent-purple font-semibold">{tasksInQueue}</span>
                <span className="text-mc-text-secondary">queued</span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <Link href="/" className="hidden sm:flex items-center gap-2" title="Teammates.ai Mission Control">
              {/* Ensure logo blends beautifully — assuming it's white/light or has a solid background we can clip */}
              <img
                src="/logo-full.jpeg"
                alt="Teammates.ai"
                className="h-7 w-auto object-contain mix-blend-screen brightness-125"
              />
              <span className="hidden lg:block ml-2 text-xs uppercase tracking-[0.2em] text-mc-accent-cyan/80 font-bold border-l border-white/10 pl-3">
                Mission Control
              </span>
            </Link>

            {workspace ? (
              <div className="flex items-center gap-2 min-w-0">
                <Link href="/" className="hidden sm:flex items-center gap-1 text-mc-text-secondary hover:text-mc-accent-cyan transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                  <LayoutGrid className="w-4 h-4" />
                </Link>
                <span className="hidden sm:block text-mc-border">/</span>
                <div className="flex items-center gap-2 px-2 md:px-3 py-1 bg-white/5 border border-white/5 rounded min-w-0 shadow-inner">
                  <span className="text-base md:text-lg">{workspace.icon}</span>
                  <span className="font-medium truncate text-sm md:text-base text-mc-text">{workspace.name}</span>
                </div>
              </div>
            ) : (
              <Link href="/" className="flex items-center gap-2 px-3 py-1.5 bg-mc-accent-cyan/10 border border-mc-accent-cyan/20 rounded hover:bg-mc-accent-cyan/20 transition-all text-mc-accent-cyan shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                <LayoutGrid className="w-4 h-4" />
                <span className="text-sm font-medium">All Workspaces</span>
              </Link>
            )}
          </div>

          {workspace && (
            <div className="hidden lg:flex items-center gap-8 px-8 py-1.5 bg-black/40 rounded-full border border-white/5">
              <div className="text-center flex items-center gap-3">
                <div className="text-xl font-heading font-bold text-mc-accent-cyan">{activeAgents}</div>
                <div className="text-[10px] text-mc-text-secondary uppercase tracking-widest text-left leading-tight">Agents<br />Active</div>
              </div>
              <div className="w-[1px] h-6 bg-white/10" />
              <div className="text-center flex items-center gap-3">
                <div className="text-xl font-heading font-bold text-mc-accent-purple">{tasksInQueue}</div>
                <div className="text-[10px] text-mc-text-secondary uppercase tracking-widest text-left leading-tight">Tasks in<br />Queue</div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 md:gap-4">
            <span className="hidden md:block text-mc-text-secondary text-sm font-mono">{format(currentTime, 'HH:mm:ss')}</span>
            <div
              className={`flex items-center gap-2 px-2 md:px-3 py-1 rounded border text-xs md:text-sm font-medium ${isOnline
                ? 'bg-mc-accent-green/20 border-mc-accent-green text-mc-accent-green'
                : 'bg-mc-accent-red/20 border-mc-accent-red text-mc-accent-red'
                }`}
            >
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-mc-accent-green animate-pulse online-glow' : 'bg-mc-accent-red'}`} />
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </div>
            <button onClick={() => router.push('/settings')} className="min-h-11 min-w-11 p-2 hover:bg-white/10 rounded-lg transition-colors text-mc-text-secondary" title="Settings">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </>
      )}
    </header>
  );
}
