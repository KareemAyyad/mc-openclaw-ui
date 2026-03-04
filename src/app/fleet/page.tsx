'use client';

import { Activity, Bot, Shield, Zap, FileText, Globe, Key, Clock, Settings2, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useGatewayWebSocket } from '@/hooks/useGatewayWebSocket';

interface AgentConfig {
    id: string;
    name: string;
    role: string;
    model: string;
    heartbeat?: string;
    tools: {
        allow: string[];
        deny: string[];
    };
}

export default function FleetPage() {
    const [agents, setAgents] = useState<AgentConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sourcePath, setSourcePath] = useState<string>('');

    const { status: wsStatus, activeAgents, lastEvent } = useGatewayWebSocket();

    useEffect(() => {
        async function fetchFleet() {
            try {
                const response = await fetch('/api/config/fleet');
                const data = await response.json();

                if (data.error) {
                    setError(data.error);
                }

                // Ensure visual mappings (color/emoji) are applied to dynamic data
                const enrichedAgents = (data.fleet || []).map((agent: any) => {
                    const visualMap: Record<string, any> = {
                        'leadgen': { emoji: '🔍', color: 'bg-emerald-500', lightGlow: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]', heartbeat: 'Every 1h' },
                        'outbound': { emoji: '💰', color: 'bg-blue-500', lightGlow: 'shadow-[0_0_15px_rgba(59,130,246,0.15)]', heartbeat: 'Every 1h' },
                        'content': { emoji: '✍️', color: 'bg-indigo-500', lightGlow: 'shadow-[0_0_15px_rgba(99,102,241,0.15)]', heartbeat: 'Every 2h' },
                        'intel': { emoji: '🕵️', color: 'bg-purple-500', lightGlow: 'shadow-[0_0_15px_rgba(168,85,247,0.15)]', heartbeat: 'Every 2h' },
                        'onboarding': { emoji: '⚡', color: 'bg-amber-500', lightGlow: 'shadow-[0_0_15px_rgba(245,158,11,0.15)]', heartbeat: 'Every 30m' },
                        'fundraise': { emoji: '🤝', color: 'bg-rose-500', lightGlow: 'shadow-[0_0_15px_rgba(244,63,94,0.15)]', heartbeat: 'Every 2h' }
                    };

                    const visuals = visualMap[agent.id] || { emoji: '🤖', color: 'bg-slate-500', lightGlow: '', heartbeat: 'Unknown' };

                    return {
                        ...agent,
                        ...visuals
                    };
                });

                setAgents(enrichedAgents);
                if (data.source) setSourcePath(data.source);

            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchFleet();
    }, []);

    if (loading) return <div className="p-8 pb-20 max-w-7xl mx-auto min-h-screen pt-32 text-center text-slate-500">Syncing with openclaw.json...</div>;

    const gatewayHealthy = wsStatus === 'connected';

    return (
        <div className="p-8 pb-20 max-w-7xl mx-auto min-h-screen">
            <header className="mb-10 animate-fade-in relative z-10">
                <h1 className="text-4xl font-heading font-bold text-slate-900 tracking-tight mb-2">
                    Fleet Architecture
                </h1>
                <p className="text-slate-500 text-lg flex items-center">
                    <Settings2 className="w-5 h-5 mr-2 inline" />
                    {sourcePath ? `Synced from ${sourcePath.split('/').pop()}` : 'Teammates.ai 6-Agent Autonomous Organization'}
                </p>
                {error && <p className="text-red-500 text-sm mt-2">Warning: {error}</p>}
            </header>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10 animate-slide-in-right relative z-10">
                <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-slate-500 font-medium text-sm">Active Agents</h3>
                        <Bot className="w-5 h-5 text-mc-accent" />
                    </div>
                    <div className="text-3xl font-bold text-slate-900">{agents.length}</div>
                    <div className="text-xs text-emerald-600 mt-2 font-medium bg-emerald-50 inline-block px-2 py-1 rounded-md">Parsed via openclaw.json</div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-slate-500 font-medium text-sm">Primary Model</h3>
                        <Zap className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="text-3xl font-bold text-slate-900">4.6</div>
                    <div className="text-xs text-slate-500 mt-2 font-medium">Claude Sonnet / Opus Mixed</div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-slate-500 font-medium text-sm">Global Autonomy Level</h3>
                        <Shield className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div className="text-3xl font-bold text-slate-900">T4</div>
                    <div className="text-xs text-slate-500 mt-2 font-medium">Gateway Tool Execution Allowed</div>
                </div>

                <div className={`bg-white rounded-2xl p-6 border shadow-sm transition-colors ${gatewayHealthy ? 'border-emerald-200/80 bg-emerald-50/10' : 'border-slate-200/60'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-slate-500 font-medium text-sm flex items-center">
                            Gateway Status
                        </h3>
                        {gatewayHealthy ? (
                            <Activity className="w-5 h-5 text-emerald-500 animate-pulse-slow" />
                        ) : (
                            <WifiOff className="w-5 h-5 text-slate-400" />
                        )}
                    </div>
                    <div className="text-3xl font-bold text-slate-900 capitalize">{wsStatus}</div>
                    <div className="text-xs text-slate-500 mt-2 font-medium font-mono truncate max-w-full">
                        {lastEvent ? `Last: ${lastEvent.type}` : 'Connecting WSS...'}
                    </div>
                </div>
            </div>

            {/* Agents Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
                {agents.map((agent: any, i) => {
                    const isOnline = activeAgents.includes(agent.id);

                    return (
                        <div
                            key={agent.id}
                            className={`bg-white rounded-3xl border p-7 transition-all duration-300 hover:shadow-md animate-scale-in ${isOnline ? 'border-emerald-200 shadow-sm' : 'border-slate-200/80'}`}
                            style={{ animationDelay: `${i * 100}ms` }}
                        >
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${agent.color} bg-opacity-10 ${agent.lightGlow}`}>
                                        {agent.emoji}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{agent.name}</h2>
                                        <p className="text-slate-500 font-medium text-sm truncate max-w-[200px]">{agent.role}</p>
                                    </div>
                                </div>
                                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${isOnline ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                    <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse-slow' : 'bg-slate-400'}`} />
                                    {isOnline ? 'Online (Live)' : 'Parsed'}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                    <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2 flex items-center">
                                        <Bot className="w-3.5 h-3.5 mr-1.5" /> Model
                                    </div>
                                    <div className="text-sm font-mono text-slate-700 font-medium truncate">
                                        {agent.model}
                                    </div>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                    <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2 flex items-center">
                                        <Clock className="w-3.5 h-3.5 mr-1.5" /> Heartbeat
                                    </div>
                                    <div className="text-sm font-mono text-slate-700 font-medium">
                                        {agent.heartbeat}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-5 border-t border-slate-100">
                                <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-3 flex items-center">
                                    <Key className="w-3.5 h-3.5 mr-1.5" /> Tool Permissions
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {agent.tools.allow.map((tool: string) => (
                                        <span key={tool} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                            {tool}
                                        </span>
                                    ))}
                                    {agent.tools.deny.map((tool: string) => (
                                        <span key={tool} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-red-50 text-red-600 border border-red-100 line-through opacity-70">
                                            {tool}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))
                })}
            </div>
        </div>
    );
}
