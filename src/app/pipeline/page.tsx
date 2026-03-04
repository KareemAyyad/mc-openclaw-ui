'use client';

import { Activity, AlertCircle, TrendingUp, Filter, Mail, Users, Target, ArrowDown, Rocket, CheckCircle, Clock, Zap, Search, Shield, DollarSign, Database, FileText, Globe, LayoutDashboard } from 'lucide-react';
import { useEffect, useState } from 'react';
import { TEAMS, AgentTeam } from '@/lib/agentRegistry';

type TabType = 'all' | 'sales' | 'marketing' | 'operations' | 'engineering';

export default function PipelinePage() {
    const [stats, setStats] = useState<any>(null);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('all');

    useEffect(() => {
        async function fetchStats() {
            try {
                const response = await fetch('/api/telemetry/stats');
                const data = await response.json();

                if (data.error) {
                    setError(data.error);
                }

                if (data.success) {
                    setStats(data);
                    setRecentActivity(data.recentActivity || []);
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchStats();
        // Poll every 30s
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div className="p-8 pb-20 max-w-7xl mx-auto min-h-screen pt-32 text-center text-slate-500">Loading fleet metrics...</div>;
    if (!stats) return <div className="p-8 pb-20 max-w-7xl mx-auto min-h-screen pt-32 text-center text-red-500">Failed to load metrics. Database offline?</div>;

    const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
        { id: 'all', label: 'Fleet Overview', icon: <LayoutDashboard className="w-4 h-4 mr-2" /> },
        { id: 'sales', label: TEAMS.sales.label, icon: <span className="mr-2">{TEAMS.sales.icon}</span> },
        { id: 'marketing', label: TEAMS.marketing.label, icon: <span className="mr-2">{TEAMS.marketing.icon}</span> },
        { id: 'operations', label: TEAMS.operations.label, icon: <span className="mr-2">{TEAMS.operations.icon}</span> },
        { id: 'engineering', label: TEAMS.engineering.label, icon: <span className="mr-2">{TEAMS.engineering.icon}</span> },
    ];

    const renderCard = (title: string, value: string | number, subline: string, colorClass: string, icon: React.ReactNode, delayIdx: number) => (
        <div key={title} className={`bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm relative overflow-hidden group animate-slide-in-right`} style={{ animationDelay: `${delayIdx * 100}ms` }}>
            <div className={`absolute top-0 right-0 w-32 h-32 ${colorClass.split(' ')[0].replace('text-', 'bg-').replace('-600', '-50')} rounded-bl-full -z-10 transition-transform group-hover:scale-110`}></div>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-500 font-medium text-sm flex items-center">
                    {icon} {title}
                </h3>
            </div>
            <div className="text-4xl font-bold text-slate-900 mb-1">{value}</div>
            <div className={`text-xs ${colorClass} font-medium flex items-center`}>
                {subline}
            </div>
        </div>
    );

    return (
        <div className="p-8 pb-20 max-w-7xl mx-auto min-h-screen">
            <header className="mb-6 animate-fade-in relative z-10">
                <div className="flex justify-between items-end border-b border-slate-200 pb-6 mb-6">
                    <div>
                        <h1 className="text-4xl font-heading font-bold text-slate-900 tracking-tight mb-2">
                            Fleet Metrics
                        </h1>
                        <p className="text-slate-500 text-lg flex items-center">
                            <TrendingUp className="w-5 h-5 mr-2 inline text-mc-accent" />
                            Multi-Team Telemetry Dashboard
                            {error && <span className="ml-3 text-sm text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-100 flex items-center"><AlertCircle className="w-3 h-3 mr-1" /> DB Error</span>}
                        </p>
                    </div>
                    <div className="flex bg-slate-100 rounded-xl p-1">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                        ? 'bg-white text-slate-900 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                    }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* TAB CONTENT */}

            {activeTab === 'all' && (
                <div className="space-y-8 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {renderCard('ICP Found', stats.sales?.icpFound || 0, 'Sales Output', 'text-emerald-600', <Filter className="w-4 h-4 mr-1.5" />, 0)}
                        {renderCard('Posts Published', stats.marketing?.postsPublished || 0, 'Marketing Output', 'text-indigo-600', <FileText className="w-4 h-4 mr-1.5" />, 1)}
                        {renderCard('Cost Alerts', stats.operations?.costAlerts || 0, 'Operations Handled', 'text-amber-600', <DollarSign className="w-4 h-4 mr-1.5" />, 2)}
                        {renderCard('Cron Jobs Run', stats.engineering?.cronJobsRun || 0, 'Engineering Velocity', 'text-sky-600', <Activity className="w-4 h-4 mr-1.5" />, 3)}
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-8">
                        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                            <Activity className="w-5 h-5 mr-2 text-slate-400" /> Recent Fleet Activity
                        </h2>
                        {recentActivity.length === 0 ? (
                            <p className="text-slate-500 italic">No telemetry events recorded yet.</p>
                        ) : (
                            <div className="space-y-4">
                                {recentActivity.slice(0, 10).map((event: any, i: number) => (
                                    <div key={event.id} className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                        <div className="mt-1">
                                            <div className="w-2 h-2 rounded-full bg-mc-accent animate-pulse-slow"></div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-slate-700">{event.agentId}</span>
                                                <span className="text-slate-400">emitted</span>
                                                <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">{event.eventType}</span>
                                            </div>
                                            <p className="text-sm text-slate-500 font-mono truncate max-w-2xl bg-slate-50/50 px-2 py-1 rounded inline-block">
                                                {typeof event.payload === 'string' ? event.payload : JSON.stringify(event.payload)}
                                            </p>
                                        </div>
                                        <div className="text-xs text-slate-400 whitespace-nowrap">
                                            {new Date(event.createdAt).toLocaleTimeString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'sales' && (
                <div className="space-y-8 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {renderCard('ICP Found', stats.sales?.icpFound || 0, 'LeadGen Agent', 'text-emerald-600', <Filter className="w-4 h-4 mr-1.5" />, 0)}
                        {renderCard('Sequenced', stats.sales?.sequencesSent || 0, 'Outbound Agent', 'text-blue-600', <Mail className="w-4 h-4 mr-1.5" />, 1)}
                        {renderCard('Active Trials', stats.sales?.activeTrials || 0, 'Estimated', 'text-amber-600', <Users className="w-4 h-4 mr-1.5" />, 2)}
                        {renderCard('PQLs Detected', stats.sales?.pqlDetected || 0, 'Ready for closing', 'text-rose-600', <Target className="w-4 h-4 mr-1.5" />, 3)}
                    </div>

                    <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm p-8 bg-gradient-to-br from-white to-emerald-50/20">
                        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                            <Rocket className="w-5 h-5 mr-2 text-emerald-500" /> B2B Funnel Flow
                        </h2>
                        {/* Render simple funnel bars */}
                        {['ICP Found', 'Sequenced', 'Active Trials', 'PQLs Detected'].map((stage, i) => {
                            const val = stage === 'ICP Found' ? stats.sales?.icpFound :
                                stage === 'Sequenced' ? stats.sales?.sequencesSent :
                                    stage === 'Active Trials' ? stats.sales?.activeTrials : stats.sales?.pqlDetected;
                            const max = Math.max(stats.sales?.icpFound || 1, 100);
                            const percent = Math.min((val / max) * 100, 100);

                            return (
                                <div key={stage} className="mb-4">
                                    <div className="flex justify-between text-sm font-medium mb-1">
                                        <span className="text-slate-700">{i + 1}. {stage}</span>
                                        <span className="text-emerald-600 font-bold">{val}</span>
                                    </div>
                                    <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-400" style={{ width: `${percent}%` }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {activeTab === 'marketing' && (
                <div className="space-y-8 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {renderCard('Blog Posts', stats.marketing?.postsPublished || 0, 'Content Agent', 'text-indigo-600', <FileText className="w-4 h-4 mr-1.5" />, 0)}
                        {renderCard('SERP Movements', stats.marketing?.serpMovements || 0, 'SEO Agent', 'text-teal-600', <Globe className="w-4 h-4 mr-1.5" />, 1)}
                        {renderCard('Briefs Rcvd', stats.marketing?.contentBriefs || 0, 'Content Agent', 'text-purple-600', <Mail className="w-4 h-4 mr-1.5" />, 2)}
                        {renderCard('Avg Rank Improv', '+3', 'Estimated', 'text-emerald-600', <TrendingUp className="w-4 h-4 mr-1.5" />, 3)}
                    </div>
                </div>
            )}

            {activeTab === 'operations' && (
                <div className="space-y-8 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {renderCard('Cost Alerts', stats.operations?.costAlerts || 0, 'FinOps Agent', 'text-orange-600', <DollarSign className="w-4 h-4 mr-1.5" />, 0)}
                        {renderCard('Invoices', stats.operations?.invoicesProcessed || 0, 'FinOps Agent', 'text-blue-600', <CheckCircle className="w-4 h-4 mr-1.5" />, 1)}
                        {renderCard('Threat Alerts', stats.operations?.competitorAlerts || 0, 'Intel Agent', 'text-rose-600', <Shield className="w-4 h-4 mr-1.5" />, 2)}
                        {renderCard('Active Threats', stats.operations?.activeThreats || 0, 'Tracked in Memory', 'text-rose-600', <AlertCircle className="w-4 h-4 mr-1.5" />, 3)}
                    </div>
                </div>
            )}

            {activeTab === 'engineering' && (
                <div className="space-y-8 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {renderCard('Deploys', stats.engineering?.deployEvents || 0, 'DevOps Agent', 'text-sky-600', <Zap className="w-4 h-4 mr-1.5" />, 0)}
                        {renderCard('Cron Execs', stats.engineering?.cronJobsRun || 0, 'Fleet Core', 'text-slate-600', <Clock className="w-4 h-4 mr-1.5" />, 1)}
                        {renderCard('Assessments', stats.engineering?.selfAssessments || 0, 'AI-Eng Agent', 'text-violet-600', <Search className="w-4 h-4 mr-1.5" />, 2)}
                        {renderCard('Prompt Edits', stats.engineering?.promptsImproved || 0, 'AI-Eng Agent', 'text-purple-600', <Activity className="w-4 h-4 mr-1.5" />, 3)}
                    </div>
                </div>
            )}
        </div>
    );
}
