'use client';

import { Calendar, Clock, ArrowRight, Activity, Zap, Shield, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { useState, useEffect } from 'react';
import { TEAMS, AGENTS, TEAM_IDS, AgentTeam } from '@/lib/agentRegistry';

interface CronJob {
  time: string;
  runDays: number[];
  agent: string;
  agentId: string;
  task: string;
  cronExpression: string;
  color: string;
}

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function SchedulePage() {
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [activeTeam, setActiveTeam] = useState<AgentTeam | 'all'>('all');
  const [scheduleData, setScheduleData] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourcePath, setSourcePath] = useState('');

  useEffect(() => {
    async function fetchSchedule() {
      try {
        const response = await fetch('/api/config/cron');
        const data = await response.json();
        if (data.jobs) {
          setScheduleData(data.jobs);
        }
        if (data.source) {
          setSourcePath(data.source);
        }
      } catch (error) {
        console.error("Failed to load cron schedule:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchSchedule();
  }, []);

  if (loading) return <div className="p-8 pb-20 max-w-7xl mx-auto min-h-screen pt-32 text-center text-slate-500">Syncing with cron-setup.sh...</div>;

  const filteredJobs = scheduleData
    .filter(job => job.runDays.includes(selectedDay))
    .filter(job => {
      if (activeTeam === 'all') return true;
      const agentMeta = AGENTS[job.agentId.toLowerCase()];
      return agentMeta?.team === activeTeam;
    })
    .sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="p-8 pb-20 max-w-7xl mx-auto min-h-screen">
      <header className="mb-10 animate-fade-in relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-heading font-bold text-slate-900 tracking-tight mb-2">
            Cron Schedule
          </h1>
          <p className="text-slate-500 text-lg flex items-center">
            <Calendar className="w-5 h-5 mr-2 inline text-mc-accent" />
            {scheduleData.length} Scheduled Automation Workflows (Asia/Dubai)
          </p>
          {sourcePath && <p className="text-slate-400 text-xs mt-1">Parsed from {sourcePath.split('/').pop()}</p>}
        </div>

        <div className="flex flex-col gap-3">
          {/* Day Selector */}
          <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1 self-end">
            {days.map((day, idx) => (
              <button
                key={day}
                onClick={() => setSelectedDay(idx)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${selectedDay === idx
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
              >
                {day.substring(0, 3)}
              </button>
            ))}
          </div>

          {/* Team Filter */}
          <div className="flex items-center gap-2 self-end">
            <span className="text-xs font-semibold text-slate-400 uppercase flex items-center mr-2">
              <Filter className="w-3 h-3 mr-1" /> Filter
            </span>
            <button
              onClick={() => setActiveTeam('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${activeTeam === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              All Teams
            </button>
            {TEAM_IDS.map((teamId) => {
              const meta = TEAMS[teamId];
              const isActive = activeTeam === teamId;
              return (
                <button
                  key={teamId}
                  onClick={() => setActiveTeam(teamId)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center ${isActive ? `${meta.bgClass} ${meta.textClass} ring-2 ring-offset-1 ${meta.ringClass}` : 'bg-white border text-slate-600 hover:bg-slate-50'}`}
                >
                  <span className="mr-1.5">{meta.icon}</span>
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Daily Timeline View */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden animate-scale-in">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-900">{days[selectedDay]} Schedule</h2>
          <span className="text-sm font-medium text-slate-500">{filteredJobs.length} jobs</span>
        </div>

        <div className="p-8 relative">
          {/* Vertical Time Line */}
          <div className="absolute left-16 top-8 bottom-8 w-px bg-slate-200 rounded-full" />

          <div className="space-y-6">
            {filteredJobs.map((job, idx) => {
              const agentMeta = AGENTS[job.agentId.toLowerCase()];
              const teamMeta = agentMeta ? TEAMS[agentMeta.team] : null;

              // Use team styling if available, fallback to the original parsing logic
              const bgClass = teamMeta ? teamMeta.bgClass : `bg-${job.color.split('-')[1] || 'slate'}-50`;
              const borderClass = teamMeta ? teamMeta.borderClass : `border-${job.color.split('-')[1] || 'slate'}-200`;
              const textClass = teamMeta ? teamMeta.textClass : `text-${job.color.split('-')[1] || 'slate'}-700`;

              return (
                <div key={idx} className="flex group relative animate-slide-in-right" style={{ animationDelay: `${idx * 50}ms` }}>

                  {/* Time */}
                  <div className="w-24 flex-shrink-0 text-right pr-6 pt-3">
                    <span className="text-sm font-bold text-slate-900 font-mono tracking-tight">{job.time}</span>
                  </div>

                  {/* Timeline Dot */}
                  <div className="absolute left-16 w-3 h-3 rounded-full bg-white border-2 border-slate-300 mt-4 -translate-x-1.5 transition-colors shadow-sm group-hover:border-mc-accent group-hover:bg-mc-accent" />

                  {/* Card */}
                  <div className={`flex-1 ml-6 p-5 rounded-2xl border transition-transform group-hover:-translate-y-1 group-hover:shadow-md ${bgClass} ${borderClass}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm bg-white/80 px-2 py-0.5 rounded border border-black/5 shadow-sm flex items-center ${textClass}`}>
                          {agentMeta && <span className="mr-1.5">{agentMeta.emoji}</span>}
                          {job.agent}
                        </span>
                        {teamMeta && (
                          <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-white/50 ${textClass}`}>
                            {teamMeta.label}
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-mono font-medium opacity-70 bg-black/5 px-2 py-1 rounded-md text-slate-700">{job.cronExpression}</div>
                    </div>

                    <h3 className={`text-lg font-bold mt-1 tracking-tight ${textClass}`}>{job.task}</h3>
                  </div>
                </div>
              );
            })}

            {filteredJobs.length === 0 && (
              <div className="text-center py-20 text-slate-500 flex flex-col items-center animate-fade-in">
                <Clock className="w-12 h-12 mb-4 text-slate-300" />
                <p className="font-medium text-lg text-slate-700">No scheduled jobs</p>
                <p className="text-sm mt-1">Agents will only run on explicit heartbeat triggers or active filter mismatch.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
