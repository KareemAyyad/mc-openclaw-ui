'use client';

import { LineChart, Users, Target, Rocket, Mail, ArrowDown, TrendingUp, Filter, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface TelemetryStats {
    icpFound: number;
    sequencesSent: number;
    activeTrials: number;
    pqlDetected: number;
    investorUpdates: number;
}

export default function PipelinePage() {
    const [stats, setStats] = useState<TelemetryStats>({
        icpFound: 0,
        sequencesSent: 0,
        activeTrials: 0,
        pqlDetected: 0,
        investorUpdates: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchStats() {
            try {
                const response = await fetch('/api/telemetry/stats');
                const data = await response.json();

                if (data.success && data.stats) {
                    setStats(data.stats);
                } else {
                    setError('Failed to load telemetry data');
                }
            } catch (err: any) {
                setError(err.message || 'Error fetching telemetry');
            } finally {
                setLoading(false);
            }
        }

        fetchStats();
        // Optional: poll every X seconds
        // const interval = setInterval(fetchStats, 10000);
        // return () => clearInterval(interval);
    }, []);

    if (loading) return <div className="p-8 pb-20 max-w-7xl mx-auto min-h-screen pt-32 text-center text-slate-500">Aggregating SQLite Telemetry DB...</div>;

    // Calculate dynamic percentages
    const totalMarket = 1250; // Could also be dynamic eventually
    const icpPercent = stats.icpFound > 0 ? ((stats.icpFound / totalMarket) * 100).toFixed(2) : '0.00';
    const seqPercent = stats.icpFound > 0 ? ((stats.sequencesSent / stats.icpFound) * 100).toFixed(1) : '0.0';
    const pqlPercent = stats.activeTrials > 0 ? ((stats.pqlDetected / stats.activeTrials) * 100).toFixed(1) : '0.0';

    // Funnel overall math
    const overallConversion = totalMarket > 0 ? ((stats.pqlDetected / totalMarket) * 100).toFixed(2) : '0.00';
    // Assume each PQL is worth ~$60k pipeline value
    const pipelineValue = (stats.pqlDetected * 60000).toLocaleString();

    return (
        <div className="p-8 pb-20 max-w-7xl mx-auto min-h-screen">
            <header className="mb-10 animate-fade-in relative z-10 flex justify-between items-end border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-4xl font-heading font-bold text-slate-900 tracking-tight mb-2">
                        Pipeline Analytics
                    </h1>
                    <p className="text-slate-500 text-lg flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2 inline text-mc-accent" />
                        Autonomous B2B SaaS Funnel
                        {error && <span className="ml-3 text-sm text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-100 flex items-center"><AlertCircle className="w-3 h-3 mr-1" /> DB Error</span>}
                    </p>
                </div>
                <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1">
                    <button className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-900 text-white shadow-md">Live (Prisma)</button>
                </div>
            </header>

            {/* Funnel Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10 relative z-10 animate-slide-in-right">
                {/* Stage 1 */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-slate-500 font-medium text-sm flex items-center">
                            <Filter className="w-4 h-4 mr-1.5" /> Found (ICP 8+)
                        </h3>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">LeadGen</span>
                    </div>
                    <div className="text-4xl font-bold text-slate-900 mb-2">{stats.icpFound}</div>
                    <div className="text-xs text-emerald-600 font-medium flex items-center opacity-70">
                        Aggregated from SQLite
                    </div>
                </div>

                {/* Stage 2 */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-slate-500 font-medium text-sm flex items-center">
                            <Mail className="w-4 h-4 mr-1.5" /> Sequenced
                        </h3>
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">Outbound</span>
                    </div>
                    <div className="text-4xl font-bold text-slate-900 mb-1">{stats.sequencesSent}</div>
                    <div className="text-xs text-slate-400 font-medium mb-2 opacity-80">{seqPercent}% ICP translation rate</div>
                    <div className="text-xs text-blue-600 font-medium flex items-center opacity-70">
                        Aggregated from SQLite
                    </div>
                </div>

                {/* Stage 3 */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-slate-500 font-medium text-sm flex items-center">
                            <Users className="w-4 h-4 mr-1.5" /> Active Trials
                        </h3>
                        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">Onboarding</span>
                    </div>
                    <div className="text-4xl font-bold text-slate-900 mb-1">{stats.activeTrials}</div>
                    <div className="text-xs text-slate-400 font-medium mb-2 opacity-80">Estimated calc</div>
                    <div className="text-xs text-amber-600 font-medium flex items-center opacity-70">
                        Aggregated from SQLite
                    </div>
                </div>

                {/* Stage 4 */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-slate-500 font-medium text-sm flex items-center">
                            <Target className="w-4 h-4 mr-1.5" /> PQLs Detected
                        </h3>
                        <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded">Onboarding</span>
                    </div>
                    <div className="text-4xl font-bold text-slate-900 mb-1">{stats.pqlDetected}</div>
                    <div className="text-xs text-slate-400 font-medium mb-2 opacity-80">{pqlPercent}% Trial-to-PQL rate</div>
                    <div className="text-xs text-rose-600 font-medium flex items-center opacity-70">
                        Ready for Kareem closing
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10 animate-fade-in" style={{ animationDelay: '200ms' }}>

                {/* Left Column: Detailed Funnel Visual */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-8">
                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                        <Rocket className="w-5 h-5 mr-2 text-slate-400" /> B2B Pipeline Flow
                    </h2>

                    <div className="space-y-4">
                        {/* LeadGen Bar */}
                        <div className="relative">
                            <div className="flex justify-between text-sm font-medium mb-1">
                                <span className="text-slate-700">1. Total Addressable Market Scanned (Intel)</span>
                                <span className="text-slate-500">{totalMarket}</span>
                            </div>
                            <div className="h-8 w-full bg-slate-100 rounded-lg overflow-hidden flex items-center">
                                <div className="h-full bg-slate-300 w-full"></div>
                            </div>
                        </div>

                        <div className="flex justify-center -my-2 relative z-10 text-slate-300"><ArrowDown className="w-5 h-5" /></div>

                        {/* ICP Bar */}
                        <div className="relative">
                            <div className="flex justify-between text-sm font-medium mb-1">
                                <span className="text-emerald-700 font-bold">2. Qualified ICP 8+ Contacts (LeadGen)</span>
                                <span className="text-emerald-600 font-bold">{stats.icpFound}</span>
                            </div>
                            <div className="h-8 w-full bg-slate-100 rounded-lg overflow-hidden flex items-center">
                                <div className="h-full bg-emerald-400 max-w-full transition-all duration-1000" style={{ width: \`\${icpPercent}%\` }}></div>
                        </div>
                    </div>

                    <div className="flex justify-center -my-2 relative z-10 text-slate-300"><ArrowDown className="w-5 h-5" /></div>

                    {/* Sequences Bar */}
                    <div className="relative">
                        <div className="flex justify-between text-sm font-medium mb-1">
                            <span className="text-blue-700 font-bold">3. Apollo Sequences Active (Outbound)</span>
                            <span className="text-blue-600 font-bold">{stats.sequencesSent}</span>
                        </div>
                        <div className="h-8 w-full bg-slate-100 rounded-lg overflow-hidden flex items-center">
                            {/* Ensure the width doesn't exceed 100% horizontally but stays proportional */}
                            <div className="h-full bg-blue-400 max-w-full transition-all duration-1000" style={{ width: \`\${Math.min(100, (stats.sequencesSent / Math.max(stats.icpFound, 1)) * 100)}%\` }}></div>
                    </div>
                </div>

                <div className="flex justify-center -my-2 relative z-10 text-slate-300"><ArrowDown className="w-5 h-5" /></div>

                {/* PQL Bar */}
                <div className="relative">
                    <div className="flex justify-between text-sm font-medium mb-1">
                        <span className="text-rose-700 font-bold">4. Product Qualified Leads (Onboarding)</span>
                        <span className="text-rose-600 font-bold">{stats.pqlDetected}</span>
                    </div>
                    <div className="h-8 w-full bg-slate-100 rounded-lg overflow-hidden flex items-center">
                        <div className="h-full bg-rose-500 max-w-full transition-all duration-1000" style={{ width: \`\${Math.min(100, (stats.pqlDetected / Math.max(stats.sequencesSent, 1)) * 100)}%\` }}></div>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Overall Conversion Rate</p>
                    <p className="text-2xl font-bold text-slate-900">{overallConversion}%</p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-medium text-slate-500 mb-1">Est. Pipeline Value</p>
                    <p className="text-2xl font-bold text-slate-900">${pipelineValue}</p>
                </div>
            </div>
        </div>
                </div >

        {/* Right Column: Key Alerts */ }
        < div className = "bg-white rounded-3xl border border-slate-200/80 shadow-sm p-8" >
                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                        <Activity className="w-5 h-5 mr-2 text-slate-400" /> Action Required
                    </h2>

                    <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-rose-50 border border-rose-100">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded">High PQA</span>
                                <span className="text-xs text-rose-500">2h ago</span>
                            </div>
                            <p className="text-sm font-medium text-slate-900 mb-1">First Abu Dhabi Bank (FAB)</p>
                            <p className="text-sm text-slate-600 leading-relaxed">Agent deployed in sandbox hit 100+ requests. Ready for SLA upgrade conversation.</p>
                            <button className="mt-3 text-xs font-bold text-rose-600 hover:text-rose-800 transition-colors">Review Account →</button>
                        </div>

                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded">Deliverability Warning</span>
                                <span className="text-xs text-amber-500">5h ago</span>
                            </div>
                            <p className="text-sm font-medium text-slate-900 mb-1">Outbound Domain Health</p>
                            <p className="text-sm text-slate-600 leading-relaxed">Open rates dropped to 18% on \`teammates-ai.co\`. Outbound agent paused sending.</p>
                            <button className="mt-3 text-xs font-bold text-amber-600 hover:text-amber-800 transition-colors">Check DNS →</button>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded">Investor Follow-up</span>
                                <span className="text-xs text-slate-500">Yesterday</span>
                            </div>
                            <p className="text-sm font-medium text-slate-900 mb-1">Hustle Fund Draft ({stats.investorUpdates} total)</p>
                            <p className="text-sm text-slate-600 leading-relaxed">Fundraise agent drafted update for partner. Awaiting your T0 approval to send.</p>
                            <button className="mt-3 text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors">Review Draft →</button>
                        </div>
                    </div>
                </div >

            </div >
        </div >
    );
}
