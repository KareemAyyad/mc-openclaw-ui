'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Clock, MessageSquare, CheckCircle2, ChevronRight, ExternalLink } from 'lucide-react';
import { AGENTS, TEAMS } from '@/lib/agentRegistry';

interface ApprovalRequest {
    id: string;
    agentId: string;
    type: string;
    description: string;
    timestamp: string;
    status: 'pending' | 'approved' | 'rejected';
}

export function ApprovalsPanel() {
    const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mocking the pending approvals since we don't have a live Slack/DB sync for them yet.
        // In reality, this would fetch from /api/approvals or agents' memory files.
        const mockData: ApprovalRequest[] = [
            {
                id: 'app-001',
                agentId: 'fundraise',
                type: 'Investor Update',
                description: 'Monthly update draft for Q3 metrics to Hustle Fund',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
                status: 'pending'
            },
            {
                id: 'app-002',
                agentId: 'seo',
                type: 'Content Brief',
                description: 'Drafted content brief for "AI Agent Orchestration" keyword',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
                status: 'pending'
            },
            {
                id: 'app-003',
                agentId: 'outbound',
                type: 'Sequence Launch',
                description: 'Ready to launch new sequence to 50 ICP contacts in Retail',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
                status: 'pending'
            }
        ];

        setTimeout(() => {
            setApprovals(mockData);
            setLoading(false);
        }, 800);
    }, []);

    if (loading) {
        return (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm animate-pulse h-64">
                <div className="h-6 w-48 bg-slate-200 rounded-md mb-6"></div>
                <div className="space-y-4">
                    <div className="h-16 w-full bg-slate-100 rounded-xl"></div>
                    <div className="h-16 w-full bg-slate-100 rounded-xl"></div>
                </div>
            </div>
        );
    }

    if (approvals.length === 0) {
        return (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col items-center justify-center h-64 text-center">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">All Caught Up</h3>
                <p className="text-sm text-slate-500">No pending approvals require your attention.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl border border-rose-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-rose-50 bg-rose-50/30 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-500" />
                    <h2 className="text-lg font-bold text-slate-900">Pending Approvals</h2>
                </div>
                <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2.5 py-1 rounded-full">
                    {approvals.length} Actions Required
                </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                {approvals.map(req => {
                    const agentMeta = AGENTS[req.agentId];
                    const teamMeta = agentMeta ? TEAMS[agentMeta.team] : null;

                    return (
                        <div key={req.id} className="bg-white border text-left border-slate-200 rounded-2xl p-4 shadow-sm hover:border-mc-accent hover:shadow-md transition-all flex items-start gap-4 group/card">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${teamMeta?.bgClass || 'bg-slate-100'} ${teamMeta?.textClass || 'text-slate-500'} border ${teamMeta?.borderClass || 'border-slate-200'}`}>
                                {agentMeta?.emoji || '🤖'}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-slate-900 capitalize">{req.agentId}</span>
                                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded font-medium">#{req.agentId === 'seo' || req.agentId === 'fundraise' ? `oc-${req.agentId}` : `oc-${req.agentId}`}</span>
                                    {req.status === 'pending' && <span className="w-2 h-2 rounded-full bg-amber-400 flex shrink-0"></span>}
                                </div>

                                <h4 className="font-semibold text-sm text-slate-800 mb-1">{req.type}</h4>
                                <p className="text-sm text-slate-600 truncate">{req.description}</p>

                                <div className="flex items-center gap-4 mt-3 text-xs font-medium text-slate-500">
                                    <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {new Date(req.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>

                            <button className="self-center p-2 rounded-lg text-mc-accent bg-mc-accent/5 hover:bg-mc-accent/10 opacity-0 group-hover/card:opacity-100 transition-opacity whitespace-nowrap text-sm font-semibold flex items-center">
                                Open in Slack <ExternalLink className="w-3 h-3 ml-1.5" />
                            </button>
                        </div>
                    );
                })}
            </div>
            <div className="p-4 border-t border-slate-100 bg-white text-center">
                <button className="text-sm font-bold text-mc-accent hover:text-mc-accent/80 transition-colors">
                    View Complete History →
                </button>
            </div>
        </div>
    );
}
