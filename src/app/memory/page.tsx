'use client';

import { useState, useEffect } from 'react';
import { Database, Search, FileJson, FileText, AlertCircle, RefreshCw, ChevronRight } from 'lucide-react';
import { TEAMS, AGENTS, memoryFiles, AgentTeam } from '@/lib/agentRegistry';

export default function MemoryPage() {
  const [selectedAgent, setSelectedAgent] = useState('leadgen');
  const [selectedFile, setSelectedFile] = useState(memoryFiles['leadgen'][0]);
  const [fileData, setFileData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset file selection when agent changes
    if (!memoryFiles[selectedAgent].includes(selectedFile)) {
      setSelectedFile(memoryFiles[selectedAgent][0]);
    }
  }, [selectedAgent, selectedFile]);

  useEffect(() => {
    async function loadFile() {
      if (!selectedAgent || !selectedFile) return;

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/memory?agent=${selectedAgent}&file=${selectedFile}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to load file');
        }

        setFileData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadFile();
  }, [selectedAgent, selectedFile]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar / File Explorer */}
      <div className="w-80 border-r border-slate-200 bg-slate-50 flex flex-col h-full">
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-2xl font-heading font-bold text-slate-900 tracking-tight flex items-center">
            <Database className="w-5 h-5 mr-2 text-mc-accent" />
            Memory
          </h1>
          <p className="text-sm text-slate-500 mt-1">Agent workspace file explorer</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {(Object.keys(TEAMS) as AgentTeam[]).map((teamId) => {
            const teamMeta = TEAMS[teamId];
            const teamAgents = Object.keys(AGENTS).filter(id => AGENTS[id].team === teamId);

            if (teamAgents.length === 0) return null;

            return (
              <div key={teamId} className="mb-6 animate-fade-in">
                <div className={`px-3 py-1.5 mb-2 rounded-md text-xs font-bold uppercase tracking-wider ${teamMeta.bgClass} ${teamMeta.textClass} flex items-center gap-2`}>
                  {teamMeta.icon} {teamMeta.label}
                </div>
                <div className="space-y-1 pl-1">
                  {teamAgents.map((agentId) => {
                    const agent = AGENTS[agentId];
                    return (
                      <div key={agentId}>
                        <button
                          onClick={() => setSelectedAgent(agentId)}
                          className={`flex items-center w-full px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${selectedAgent === agentId ? 'bg-white shadow-sm border border-slate-200 text-slate-900' : 'text-slate-600 hover:bg-slate-200/50'
                            }`}
                        >
                          <span className={`w-6 h-6 rounded flex items-center justify-center mr-2 ${teamMeta.bgClass} ${teamMeta.textClass}`}>
                            {agent.emoji}
                          </span>
                          <span className="capitalize">{agentId}</span>
                        </button>

                        {selectedAgent === agentId && (
                          <div className="mt-2 ml-4 pl-4 border-l-2 border-slate-200 space-y-1 animate-fade-in relative z-10">
                            {memoryFiles[agentId].map(file => (
                              <button
                                key={file}
                                onClick={() => setSelectedFile(file)}
                                className={`w-full text-left px-3 py-1.5 rounded-md text-sm truncate flex items-center ${selectedFile === file
                                    ? 'bg-mc-accent/10 text-mc-accent font-medium'
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                                  }`}
                              >
                                {file.endsWith('.jsonl') || file.endsWith('.json') ? (
                                  <FileJson className="w-3.5 h-3.5 mr-2 opacity-70 shrink-0" />
                                ) : (
                                  <FileText className="w-3.5 h-3.5 mr-2 opacity-70 shrink-0" />
                                )}
                                <span className="truncate">{file}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white flex flex-col h-full overflow-hidden">
        {/* Top Bar */}
        <div className="h-16 border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center text-sm font-medium text-slate-500">
            <span className="capitalize">{selectedAgent}</span>
            <ChevronRight className="w-4 h-4 mx-2 text-slate-300" />
            <span className="text-slate-900 flex items-center">
              {selectedFile?.endsWith('.jsonl') || selectedFile?.endsWith('.json') ? (
                <FileJson className="w-4 h-4 mr-2 text-blue-500" />
              ) : (
                <FileText className="w-4 h-4 mr-2 text-slate-400" />
              )}
              {selectedFile}
            </span>
            {fileData?.source && (
              <span className="ml-4 px-2 py-0.5 rounded text-xs font-mono bg-slate-100 text-slate-500 border border-slate-200">
                Source: {fileData.source}
              </span>
            )}
          </div>

          <button
            onClick={() => {
              setLoading(true);
              // Small artificial delay to show loading state on manual refresh
              setTimeout(() => setLoading(false), 500);
            }}
            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* File Content Area */}
        <div className="flex-1 overflow-auto bg-slate-50/50 p-8">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mc-accent"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl flex items-start max-w-2xl">
              <AlertCircle className="w-6 h-6 mr-4 shrink-0" />
              <div>
                <h3 className="font-bold text-lg mb-1">Error Loading Memory</h3>
                <p>{error}</p>
              </div>
            </div>
          ) : !fileData?.exists ? (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto animate-fade-in">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-6">
                <Database className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Memory Not Synced</h3>
              <p className="text-slate-500 leading-relaxed">
                {fileData?.message || 'This file does not exist locally yet. It will appear here once the agent creates it on Render and the workspace is synced.'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
              {fileData.type === 'jsonl' ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Row Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {fileData.data.map((row: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50/50 font-mono text-xs">
                          <td className="px-6 py-4">
                            <pre className="whitespace-pre-wrap text-slate-700">
                              {JSON.stringify(row, null, 2)}
                            </pre>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 font-mono text-sm leading-relaxed text-slate-700 whitespace-pre-wrap flex-wrap break-words min-w-0">
                  {fileData.data}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
