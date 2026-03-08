'use client';

import { useState, useEffect } from 'react';
import { Activity, MessageSquare, ArrowRight, BookOpen, AlertCircle, FileJson, Layers, Database } from 'lucide-react';
import { TEAMS, AGENTS, TEAM_IDS, AgentTeam } from '@/lib/agentRegistry';

interface SchemaDef {
    id: string;
    type: string;
    version: string;
    sender: string;
    receiver: string;
    purpose: string;
    schema: string;
}

export default function CommsPage() {
    const [schemas, setSchemas] = useState<SchemaDef[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedSchema, setSelectedSchema] = useState<string | null>(null);

    useEffect(() => {
        async function fetchSchemas() {
            try {
                const response = await fetch('/api/config/schemas');
                const data = await response.json();

                if (data.error) {
                    setError(data.error);
                } else if (data.schemas) {
                    setSchemas(data.schemas);
                    if (data.schemas.length > 0) {
                        setSelectedSchema(data.schemas[0].id);
                    }
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchSchemas();
    }, []);

    if (loading) return <div className="p-8 pb-20 max-w-7xl mx-auto min-h-screen pt-32 text-center text-slate-500">Parsing SCHEMAS.md...</div>;

    const activeSchema = schemas.find(s => s.id === selectedSchema);

    // Group schemas by sender agent team for organized sidebar
    const groupedSchemas = schemas.reduce((acc, schema) => {
        const senderMeta = AGENTS[schema.sender];
        const team = senderMeta ? senderMeta.team : 'engineering';
        if (!acc[team]) acc[team] = [];
        acc[team].push(schema);
        return acc;
    }, {} as Record<string, SchemaDef[]>);

    const renderAgentNode = (agentId: string, badge: string, label: string) => {
        const agentMeta = AGENTS[agentId];
        const teamMeta = agentMeta ? TEAMS[agentMeta.team] : null;
        return (
            <div className="flex flex-col items-center">
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-md border mb-3 relative ${teamMeta
                        ? `${teamMeta.bgSolidClass} ${teamMeta.borderActiveClass}`
                        : 'bg-slate-100 border-slate-200'
                    }`}>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 font-bold text-xs text-slate-500">{badge}</div>
                    {agentMeta?.emoji || '🤖'}
                </div>
                <span className="font-bold text-slate-900 capitalize">{agentId}</span>
                <span className="text-xs text-slate-500">{label}</span>
            </div>
        );
    };

    return (
        <div className="p-8 pb-20 max-w-7xl mx-auto min-h-screen flex flex-col h-screen overflow-hidden">
            <header className="mb-8 animate-fade-in shrink-0">
                <h1 className="text-4xl font-heading font-bold text-slate-900 tracking-tight mb-2">
                    Fleet Communications
                </h1>
                <p className="text-slate-500 text-lg flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2 inline text-mc-accent" />
                    Inter-Agent sessions_send Registry
                </p>
                {error && <p className="text-red-500 text-sm mt-2 flex items-center"><AlertCircle className="w-4 h-4 mr-1" /> {error}</p>}
            </header>

            <div className="flex flex-1 gap-8 min-h-0 relative z-10">
                {/* Left Sidebar - Schema List */}
                <div className="w-1/3 bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-y-auto animate-slide-in-right p-6">
                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                        <Database className="w-5 h-5 mr-2 text-slate-400" />
                        Active Schemas ({schemas.length})
                    </h2>

                    <div className="space-y-6">
                        {TEAM_IDS.map((teamId) => {
                            const teamSchemas = groupedSchemas[teamId];
                            if (!teamSchemas || teamSchemas.length === 0) return null;
                            const teamMeta = TEAMS[teamId];

                            return (
                                <div key={teamId} className="animate-fade-in">
                                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 ml-2 flex items-center">
                                        <span className={`w-2 h-2 rounded-full mr-2 ${teamMeta.colorClass}`}></span>
                                        {teamMeta.label} Origin
                                    </div>
                                    <div className="space-y-2">
                                        {teamSchemas.map((schema) => {
                                            const isActive = selectedSchema === schema.id;
                                            return (
                                                <button
                                                    key={schema.id}
                                                    onClick={() => setSelectedSchema(schema.id)}
                                                    className={`w-full text-left p-3 rounded-xl border transition-all ${isActive
                                                            ? `bg-white ${teamMeta.borderActiveClass} shadow-md ring-1 ${teamMeta.ringClass} flex-1`
                                                            : 'bg-slate-50 border-transparent hover:bg-slate-100 hover:border-slate-200'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className={`font-mono text-sm font-bold ${isActive ? 'text-slate-900' : 'text-slate-700'}`}>
                                                            {schema.type}
                                                        </span>
                                                        <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                                                            {schema.version}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center text-xs text-slate-500">
                                                        <span className="capitalize">{schema.sender}</span>
                                                        <ArrowRight className="w-3 h-3 mx-1 text-slate-300" />
                                                        <span className="capitalize">{schema.receiver}</span>
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Right Panel - Schema Details & Diagram */}
                <div className="flex-1 flex flex-col gap-6 min-h-0 animate-fade-in" style={{ animationDelay: '100ms' }}>

                    {/* Visual Flow Header */}
                    {activeSchema ? (
                        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-8 shrink-0 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-bl-full -z-10"></div>

                            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-8">Data Flow Execution</h2>

                            <div className="flex items-center justify-center gap-6">
                                {/* Sender Agent */}
                                {renderAgentNode(activeSchema.sender, 'TX', 'Sender Component')}

                                {/* Flow Node */}
                                <div className="flex flex-col items-center flex-1 px-4 relative">
                                    <div className="w-full h-px bg-slate-200 absolute top-1/2 -translate-y-1/2 -z-10"></div>
                                    <div className="w-full h-px bg-mc-accent absolute top-1/2 -translate-y-1/2 -z-0 scale-x-0 origin-left animate-scale-x"></div>
                                    <div className="bg-white border-2 border-mc-accent shadow-sm px-4 py-2 rounded-full flex items-center gap-2 z-10 animate-fade-in">
                                        <Layers className="w-4 h-4 text-mc-accent" />
                                        <span className="font-mono text-sm font-bold text-slate-800">{activeSchema.type}</span>
                                        <span className="bg-slate-100 text-slate-500 text-[10px] px-1.5 py-0.5 rounded font-bold">{activeSchema.version}</span>
                                    </div>
                                </div>

                                {/* Receiver Agent */}
                                {renderAgentNode(activeSchema.receiver, 'RX', 'Receiver Component')}
                            </div>
                        </div>
                    ) : null}

                    {/* Schema Definition */}
                    {activeSchema ? (
                        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                                <h3 className="text-lg font-bold text-slate-900 flex items-center">
                                    <BookOpen className="w-5 h-5 mr-2 text-slate-400" />
                                    Purpose
                                </h3>
                                <p className="text-slate-600 mt-2">{activeSchema.purpose || 'No purpose defined.'}</p>
                            </div>
                            <div className="p-6 flex-1 overflow-y-auto bg-slate-900 text-slate-300 font-mono text-sm leading-relaxed relative group">
                                <div className="absolute top-4 right-4 bg-white/10 px-2 py-1 rounded text-xs font-bold text-white uppercase tracking-wider flex items-center">
                                    <FileJson className="w-3 h-3 mr-1" /> Payload Definition
                                </div>
                                <pre className="w-full">
                                    {activeSchema.schema}
                                </pre>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm flex-1 flex flex-col items-center justify-center text-slate-400">
                            <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
                            <p>Select a schema to view communication flow</p>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
