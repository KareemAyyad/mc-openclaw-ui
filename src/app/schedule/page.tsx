'use client';

import { Calendar, Clock, ArrowRight, Activity, Zap, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';

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
const hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

export default function SchedulePage() {
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
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

  return (
    <div className="p-8 pb-20 max-w-7xl mx-auto min-h-screen">
      <header className="mb-10 animate-fade-in relative z-10 flex justify-between items-end">
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

        <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1">
          {days.map((day, idx) => (
            <button
              key={day}
              onClick={() => setSelectedDay(idx)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedDay === idx
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
            >
              {day.substring(0, 3)}
            </button>
          ))}
        </div>
      </header>

      {/* Daily Timeline View */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden animate-scale-in">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-900">{days[selectedDay]} Schedule</h2>
        </div>

        <div className="p-8 relative">
          {/* Vertical Time Line */}
          <div className="absolute left-16 top-8 bottom-8 w-px bg-slate-200 rounded-full" />

          <div className="space-y-6">
            {scheduleData
              .filter(job => job.runDays.includes(selectedDay))
              .sort((a, b) => a.time.localeCompare(b.time))
              .map((job, idx) => (
                <div key={idx} className="flex group relative animate-slide-in-right" style={{ animationDelay: `${idx * 50}ms` }}>

                  {/* Time */}
                  <div className="w-24 flex-shrink-0 text-right pr-6 pt-3">
                    <span className="text-sm font-bold text-slate-900 font-mono tracking-tight">{job.time}</span>
                  </div>

                  {/* Timeline Dot */}
                  <div className="absolute left-16 w-3 h-3 rounded-full bg-white border-2 border-slate-300 mt-4 -translate-x-1.5 group-hover:border-mc-accent group-hover:bg-mc-accent transition-colors shadow-sm" />

                  {/* Card */}
                  <div className={`flex-1 ml-6 p-5 rounded-2xl border ${job.color} transition-transform group-hover:-translate-y-1 group-hover:shadow-md`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm bg-white/60 px-2 py-0.5 rounded border border-black/5 shadow-sm">
                          {job.agent}
                        </span>
                      </div>
                      <div className="text-xs font-mono font-medium opacity-70 bg-black/5 px-2 py-1 rounded-md">{job.cronExpression}</div>
                    </div>

                    <h3 className="text-lg font-bold mt-1 tracking-tight">{job.task}</h3>
                  </div>
                </div>
              ))}

            {scheduleData.filter(job => job.runDays.includes(selectedDay)).length === 0 && (
              <div className="text-center py-20 text-slate-500 flex flex-col items-center">
                <Clock className="w-12 h-12 mb-4 text-slate-300" />
                <p className="font-medium">No scheduled jobs for {days[selectedDay]}</p>
                <p className="text-sm mt-1">Agents will only run on explicit heartbeat triggers.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
