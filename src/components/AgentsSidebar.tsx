'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, ChevronRight, ChevronLeft, Zap, ZapOff, Loader2, Search, Bot, Cpu, Terminal, Shield } from 'lucide-react';
import { useMissionControl } from '@/lib/store';
import type { Agent, AgentStatus, OpenClawSession } from '@/lib/types';
import { AgentModal } from './AgentModal';
import { DiscoverAgentsModal } from './DiscoverAgentsModal';

type FilterTab = 'all' | 'working' | 'standby';

interface AgentsSidebarProps {
  workspaceId?: string;
  workspaceId?: string;
  mobileMode?: boolean;
  isPortrait?: boolean;
}

const getAgentIcon = (role: string = '') => {
  const lowercaseRole = role.toLowerCase();
  if (lowercaseRole.includes('planner') || lowercaseRole.includes('manager') || lowercaseRole.includes('orchestrator')) return <Cpu className="w-5 h-5 text-mc-accent-cyan" />;
  if (lowercaseRole.includes('coder') || lowercaseRole.includes('developer') || lowercaseRole.includes('engineer')) return <Terminal className="w-5 h-5 text-mc-accent-purple" />;
  if (lowercaseRole.includes('reviewer') || lowercaseRole.includes('tester') || lowercaseRole.includes('qa')) return <Shield className="w-5 h-5 text-mc-accent-green" />;
  return <Bot className="w-5 h-5 text-mc-text-secondary" />;
};

export function AgentsSidebar({ workspaceId, mobileMode = false, isPortrait = true }: AgentsSidebarProps) {
  const { agents, selectedAgent, setSelectedAgent, agentOpenClawSessions, setAgentOpenClawSession } = useMissionControl();
  const [filter, setFilter] = useState<FilterTab>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [showDiscoverModal, setShowDiscoverModal] = useState(false);
  const [connectingAgentId, setConnectingAgentId] = useState<string | null>(null);
  const [activeSubAgents, setActiveSubAgents] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);

  const effectiveMinimized = mobileMode ? false : isMinimized;
  const toggleMinimize = () => setIsMinimized(!isMinimized);

  const loadOpenClawSessions = useCallback(async () => {
    for (const agent of agents) {
      try {
        const res = await fetch(`/api/agents/${agent.id}/openclaw`);
        if (res.ok) {
          const data = await res.json();
          if (data.linked && data.session) {
            setAgentOpenClawSession(agent.id, data.session as OpenClawSession);
          }
        }
      } catch (error) {
        console.error(`Failed to load OpenClaw session for ${agent.name}:`, error);
      }
    }
  }, [agents, setAgentOpenClawSession]);

  useEffect(() => {
    if (agents.length > 0) {
      loadOpenClawSessions();
    }
  }, [loadOpenClawSessions, agents.length]);

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

  const handleConnectToOpenClaw = async (agent: Agent, e: React.MouseEvent) => {
    e.stopPropagation();
    setConnectingAgentId(agent.id);

    try {
      const existingSession = agentOpenClawSessions[agent.id];

      if (existingSession) {
        const res = await fetch(`/api/agents/${agent.id}/openclaw`, { method: 'DELETE' });
        if (res.ok) {
          setAgentOpenClawSession(agent.id, null);
        }
      } else {
        const res = await fetch(`/api/agents/${agent.id}/openclaw`, { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          setAgentOpenClawSession(agent.id, data.session as OpenClawSession);
        } else {
          const error = await res.json();
          console.error('Failed to connect to OpenClaw:', error);
          alert(`Failed to connect: ${error.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('OpenClaw connection error:', error);
    } finally {
      setConnectingAgentId(null);
    }
  };

  const filteredAgents = agents.filter((agent) => {
    if (filter === 'all') return true;
    return agent.status === filter;
  });

  const getStatusBadge = (status: AgentStatus) => {
    const styles = {
      standby: 'status-standby',
      working: 'status-working',
      offline: 'status-offline',
    };
    return styles[status] || styles.standby;
  };

  return (
    <aside
      className={`glass-sidebar ${mobileMode ? 'border border-white/5 rounded-lg h-full' : 'border-r border-white/5'} flex flex-col transition-all duration-300 ease-in-out z-10 ${effectiveMinimized ? 'w-12' : mobileMode ? 'w-full' : 'w-64'
        }`}
    >
      <div className="p-3 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center">
          {!mobileMode && (
            <button
              onClick={toggleMinimize}
              className="p-1 rounded hover:bg-mc-bg-tertiary text-mc-text-secondary hover:text-mc-text transition-colors"
              aria-label={effectiveMinimized ? 'Expand agents' : 'Minimize agents'}
            >
              {effectiveMinimized ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}
          {!effectiveMinimized && (
            <>
              <span className="text-sm font-medium uppercase tracking-wider">Agents</span>
              <span className="bg-mc-bg-tertiary text-mc-text-secondary text-xs px-2 py-0.5 rounded ml-2">{agents.length}</span>
            </>
          )}
        </div>

        {!effectiveMinimized && (
          <>
            {activeSubAgents > 0 && (
              <div className="mb-3 mt-3 px-3 py-2 status-working rounded-lg">
                <div className="flex items-center gap-2 text-sm max-w-full">
                  <span className="animate-pulse">●</span>
                  <span className="truncate">Active Sub-Agents:</span>
                  <span className="font-bold">{activeSubAgents}</span>
                </div>
              </div>
            )}

            <div className={`mt-3 ${mobileMode && isPortrait ? 'grid grid-cols-3 gap-2' : 'flex gap-1'}`}>
              {(['all', 'working', 'standby'] as FilterTab[]).map((tab) => (
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
          </>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1 hide-scrollbar">
        {filteredAgents.map((agent) => {
          const openclawSession = agentOpenClawSessions[agent.id];

          if (effectiveMinimized) {
            return (
              <div key={agent.id} className="flex justify-center py-3">
                <button
                  onClick={() => {
                    setSelectedAgent(agent);
                    setEditingAgent(agent);
                  }}
                  className="relative group"
                  title={`${agent.name} - ${agent.role}`}
                >
                  <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center filter drop-shadow">
                    {getAgentIcon(agent.role)}
                  </div>
                  {openclawSession && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-mc-accent-green rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)] border border-black/50" />}
                  {!!agent.is_master && <span className="absolute -top-1 -right-1 text-xs text-mc-accent-yellow drop-shadow-md">★</span>}
                  <span
                    className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${agent.status === 'working' ? 'bg-mc-accent-cyan shadow-[0_0_5px_rgba(34,211,238,0.8)]' : agent.status === 'standby' ? 'bg-mc-text-secondary' : 'bg-mc-accent-red/50'
                      }`}
                  />
                  <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 glass-panel text-mc-text text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                    {agent.name}
                  </div>
                </button>
              </div>
            );
          }

          const isConnecting = connectingAgentId === agent.id;
          return (
            <div key={agent.id} className={`w-full rounded-xl transition-all border ${selectedAgent?.id === agent.id ? 'bg-mc-accent-cyan/10 border-mc-accent-cyan/20' : 'border-transparent hover:bg-white/5 hover:border-white/10'}`}>
              <button
                onClick={() => {
                  setSelectedAgent(agent);
                  setEditingAgent(agent);
                }}
                className="w-full flex items-center gap-3 p-3 text-left min-h-11"
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center filter drop-shadow group-hover:bg-white/10 transition-colors">
                    {getAgentIcon(agent.role)}
                  </div>
                  {openclawSession && <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-mc-accent-green shadow-[0_0_8px_rgba(16,185,129,0.5)] rounded-full border border-black/50" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{agent.name}</span>
                    {!!agent.is_master && <span className="text-xs text-mc-accent-yellow">★</span>}
                  </div>
                  <div className="text-xs text-mc-text-secondary truncate flex items-center gap-1">
                    {agent.role}
                    {agent.source === 'gateway' && (
                      <span className="text-[10px] px-1 py-0 bg-blue-500/20 text-blue-400 rounded" title="Imported from Gateway">
                        GW
                      </span>
                    )}
                  </div>
                </div>

                <span className={`text-xs px-2 py-0.5 rounded uppercase ${getStatusBadge(agent.status)}`}>{agent.status}</span>
              </button>

              {!!agent.is_master && (
                <div className="px-2 pb-2">
                  <button
                    onClick={(e) => handleConnectToOpenClaw(agent, e)}
                    disabled={isConnecting}
                    className={`w-full min-h-11 flex items-center justify-center gap-2 px-2 rounded-lg text-xs transition-colors border ${openclawSession
                        ? 'bg-mc-accent-green/10 text-mc-accent-green border-mc-accent-green/20 hover:bg-mc-accent-green/20'
                        : 'bg-black/20 text-mc-text-secondary border-white/5 hover:bg-white/5 hover:border-white/10 hover:text-mc-text'
                      }`}
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Connecting...</span>
                      </>
                    ) : openclawSession ? (
                      <>
                        <Zap className="w-3 h-3" />
                        <span>OpenClaw Connected</span>
                      </>
                    ) : (
                      <>
                        <ZapOff className="w-3 h-3" />
                        <span>Connect to OpenClaw</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!effectiveMinimized && (
        <div className="p-3 border-t border-white/5 space-y-2 bg-white/[0.02]">
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full min-h-11 flex items-center justify-center gap-2 px-3 border border-white/10 hover:border-mc-accent-cyan/30 hover:bg-mc-accent-cyan/5 rounded-xl text-sm text-mc-text-secondary hover:text-mc-accent-cyan transition-colors group"
          >
            <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Add Agent
          </button>
          <button
            onClick={() => setShowDiscoverModal(true)}
            className="w-full min-h-11 flex items-center justify-center gap-2 px-3 border border-mc-accent-purple/20 hover:border-mc-accent-purple/40 hover:bg-mc-accent-purple/10 rounded-xl text-sm text-mc-accent-purple hover:text-mc-accent-purple/80 transition-colors group"
          >
            <Search className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Import from Gateway
          </button>
        </div>
      )}

      {showCreateModal && <AgentModal onClose={() => setShowCreateModal(false)} workspaceId={workspaceId} />}
      {editingAgent && <AgentModal agent={editingAgent} onClose={() => setEditingAgent(null)} workspaceId={workspaceId} />}
      {showDiscoverModal && <DiscoverAgentsModal onClose={() => setShowDiscoverModal(false)} workspaceId={workspaceId} />}
    </aside>
  );
}
