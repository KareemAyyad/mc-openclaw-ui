'use client';

import { useState, useCallback } from 'react';
import { X, Save, Trash2, Activity, Package, Bot, ClipboardList, Plus, Sparkles } from 'lucide-react';
import { useMissionControl } from '@/lib/store';
import { triggerAutoDispatch, shouldTriggerAutoDispatch } from '@/lib/auto-dispatch';
import { ActivityLog } from './ActivityLog';
import { DeliverablesList } from './DeliverablesList';
import { SessionsList } from './SessionsList';
import { PlanningTab } from './PlanningTab';
import { AgentModal } from './AgentModal';
import type { Task, TaskPriority, TaskStatus } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';

type TabType = 'overview' | 'planning' | 'activity' | 'deliverables' | 'sessions';

interface TaskModalProps {
  task?: Task;
  onClose: () => void;
  workspaceId?: string;
}

export function TaskModal({ task, onClose, workspaceId }: TaskModalProps) {
  const { agents, addTask, updateTask, addEvent } = useMissionControl();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [usePlanningMode, setUsePlanningMode] = useState(false);
  // Auto-switch to planning tab if task is in planning status
  const [activeTab, setActiveTab] = useState<TabType>(task?.status === 'planning' ? 'planning' : 'overview');

  // Stable callback for when spec is locked - use window.location.reload() to refresh data
  const handleSpecLocked = useCallback(() => {
    window.location.reload();
  }, []);

  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'normal' as TaskPriority,
    status: task?.status || 'inbox' as TaskStatus,
    assigned_agent_id: task?.assigned_agent_id || '',
    due_date: task?.due_date || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = task ? `/api/tasks/${task.id}` : '/api/tasks';
      const method = task ? 'PATCH' : 'POST';

      const payload = {
        ...form,
        // If planning mode is enabled for new tasks, override status to 'planning'
        status: (!task && usePlanningMode) ? 'planning' : form.status,
        assigned_agent_id: form.assigned_agent_id || null,
        due_date: form.due_date || null,
        workspace_id: workspaceId || task?.workspace_id || 'default',
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const savedTask = await res.json();

        if (task) {
          updateTask(savedTask);

          // Check if auto-dispatch should be triggered and execute it
          if (shouldTriggerAutoDispatch(task.status, savedTask.status, savedTask.assigned_agent_id)) {
            const result = await triggerAutoDispatch({
              taskId: savedTask.id,
              taskTitle: savedTask.title,
              agentId: savedTask.assigned_agent_id,
              agentName: savedTask.assigned_agent?.name || 'Unknown Agent',
              workspaceId: savedTask.workspace_id
            });

            if (!result.success) {
              console.error('Auto-dispatch failed:', result.error);
            }
          }

          onClose();
        } else {
          addTask(savedTask);
          addEvent({
            id: crypto.randomUUID(),
            type: 'task_created',
            task_id: savedTask.id,
            message: `New task: ${savedTask.title}`,
            created_at: new Date().toISOString(),
          });

          // If planning mode is enabled, auto-generate questions and keep modal open
          if (usePlanningMode) {
            // Trigger question generation in background
            fetch(`/api/tasks/${savedTask.id}/planning`, { method: 'POST' })
              .then((res) => {
                if (res.ok) {
                  // Update our local task reference and switch to planning tab
                  updateTask({ ...savedTask, status: 'planning' });
                  setActiveTab('planning');
                } else {
                  return res.json().then((data) => {
                    console.error('Failed to start planning:', data.error);
                  });
                }
              })
              .catch((error) => {
                console.error('Failed to start planning:', error);
              });
          }
          onClose();
        }
      }
    } catch (error) {
      console.error('Failed to save task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!task || !confirm(`Delete "${task.title}"?`)) return;

    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' });
      if (res.ok) {
        useMissionControl.setState((state) => ({
          tasks: state.tasks.filter((t) => t.id !== task.id),
        }));
        onClose();
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const statuses: TaskStatus[] = ['planning', 'inbox', 'assigned', 'in_progress', 'testing', 'review', 'done'];
  const priorities: TaskPriority[] = ['low', 'normal', 'high', 'urgent'];

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: null },
    { id: 'planning' as TabType, label: 'Planning', icon: <ClipboardList className="w-4 h-4" /> },
    { id: 'activity' as TabType, label: 'Activity', icon: <Activity className="w-4 h-4" /> },
    { id: 'deliverables' as TabType, label: 'Deliverables', icon: <Package className="w-4 h-4" /> },
    { id: 'sessions' as TabType, label: 'Sessions', icon: <Bot className="w-4 h-4" /> },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center z-50 p-3 sm:p-4"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="glass-panel border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-t-2xl sm:rounded-2xl w-full max-w-2xl max-h-[92vh] sm:max-h-[90vh] flex flex-col pb-[env(safe-area-inset-bottom)] sm:pb-0 overflow-hidden relative"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-mc-accent-cyan via-mc-accent-purple to-mc-accent-cyan opacity-50" />

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5 flex-shrink-0 bg-white/[0.02]">
          <h2 className="text-xl font-heading font-bold text-white flex items-center gap-3">
            {!task && <Sparkles className="w-5 h-5 text-mc-accent-cyan" />}
            {task ? task.title : 'Initialize New Mission'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg text-mc-text-secondary hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs - only show for existing tasks */}
        {task && (
          <div className="flex border-b border-white/5 flex-shrink-0 overflow-x-auto bg-black/20 hide-scrollbar pt-2 px-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 min-h-12 py-2 text-sm font-bold transition-all whitespace-nowrap rounded-t-lg border-b-2 relative top-[1px] ${activeTab === tab.id
                    ? 'text-mc-accent-cyan border-mc-accent-cyan bg-mc-accent-cyan/10 shadow-[0_-10px_20px_rgba(6,182,212,0.1)]'
                    : 'text-mc-text-secondary border-transparent hover:text-white hover:bg-white/5 hover:border-white/10'
                  }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-mc-text-secondary font-medium mb-2">Mission Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 focus:outline-none focus:border-mc-accent-cyan focus:ring-1 focus:ring-mc-accent-cyan placeholder:text-mc-text-secondary/50 text-white font-medium transition-all"
                  placeholder="What needs to be accomplished?"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-mc-text-secondary font-medium mb-2">Mission Briefing</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 focus:outline-none focus:border-mc-accent-cyan focus:ring-1 focus:ring-mc-accent-cyan placeholder:text-mc-text-secondary/50 text-white transition-all resize-none"
                  placeholder="Provide detailed instructions..."
                />
              </div>

              {/* Planning Mode Toggle - only for new tasks */}
              {!task && (
                <div className={`p-4 rounded-xl border transition-all cursor-pointer ${usePlanningMode ? 'bg-mc-accent-purple/10 border-mc-accent-purple/30 shadow-[0_0_20px_rgba(139,92,246,0.1)]' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
                  <label className="flex items-start gap-4 cursor-pointer w-full">
                    <div className={`w-5 h-5 rounded mt-0.5 border flex items-center justify-center transition-colors ${usePlanningMode ? 'bg-mc-accent-purple border-mc-accent-purple' : 'border-mc-text-secondary/50 bg-black/40'}`}>
                      {usePlanningMode && <ClipboardList className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <input
                      type="checkbox"
                      checked={usePlanningMode}
                      onChange={(e) => setUsePlanningMode(e.target.checked)}
                      className="hidden"
                    />
                    <div className="flex-1">
                      <span className={`font-bold text-sm tracking-wide ${usePlanningMode ? 'text-white' : 'text-mc-text-secondary'}`}>
                        Initialize Planning Protocol
                      </span>
                      <p className="text-xs text-mc-text-secondary mt-1.5 leading-relaxed">
                        Engage AI to break down complex objectives. The system will interview you to define scope, goals, and constraints before dispatching agents. Recommended for critical missions.
                      </p>
                    </div>
                  </label>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Status */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-mc-text-secondary font-medium mb-2">Current Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 focus:outline-none focus:border-mc-accent-cyan text-white transition-all appearance-none"
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s} className="bg-mc-bg-secondary text-white">
                        {s.replace('_', ' ').toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-mc-text-secondary font-medium mb-2">Priority Level</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 focus:outline-none focus:border-mc-accent-cyan text-white transition-all appearance-none"
                  >
                    {priorities.map((p) => (
                      <option key={p} value={p} className="bg-mc-bg-secondary text-white">
                        {p.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Assigned Agent */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-mc-text-secondary font-medium mb-2">Assigned Operative</label>
                  <select
                    value={form.assigned_agent_id}
                    onChange={(e) => {
                      if (e.target.value === '__add_new__') {
                        setShowAgentModal(true);
                      } else {
                        setForm({ ...form, assigned_agent_id: e.target.value });
                      }
                    }}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 focus:outline-none focus:border-mc-accent-cyan text-white transition-all appearance-none"
                  >
                    <option value="" className="bg-mc-bg-secondary">Unassigned</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id} className="bg-mc-bg-secondary text-white">
                        {agent.name} - {agent.role}
                      </option>
                    ))}
                    <option value="__add_new__" className="bg-mc-bg-secondary text-mc-accent-cyan font-bold">
                      ➕ Requisition New Agent...
                    </option>
                  </select>
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-mc-text-secondary font-medium mb-2">Mission Deadline</label>
                  <input
                    type="datetime-local"
                    value={form.due_date}
                    onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 focus:outline-none focus:border-mc-accent-cyan text-white transition-all"
                  />
                </div>
              </div>
            </form>
          )}

          {/* Planning Tab */}
          {activeTab === 'planning' && task && (
            <PlanningTab
              taskId={task.id}
              onSpecLocked={handleSpecLocked}
            />
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && task && (
            <ActivityLog taskId={task.id} />
          )}

          {/* Deliverables Tab */}
          {activeTab === 'deliverables' && task && (
            <DeliverablesList taskId={task.id} />
          )}

          {/* Sessions Tab */}
          {activeTab === 'sessions' && task && (
            <SessionsList taskId={task.id} />
          )}
        </div>

        {/* Footer - only show on overview tab */}
        {activeTab === 'overview' && (
          <div className="flex items-center justify-between p-5 border-t border-white/5 flex-shrink-0 bg-white/[0.02]">
            <div className="flex gap-2">
              {task && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="min-h-11 flex items-center gap-2 px-4 py-2 text-mc-accent-red hover:bg-mc-accent-red/10 border border-transparent hover:border-mc-accent-red/20 rounded-lg text-sm font-bold transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  Decommission
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="min-h-11 px-5 py-2 text-sm font-medium text-mc-text-secondary hover:text-white border border-white/10 rounded-full hover:bg-white/5 transition-all"
              >
                Abort
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="min-h-11 flex items-center gap-2 px-6 py-2 bg-mc-accent-cyan text-black rounded-full text-sm font-bold hover:bg-mc-accent-cyan/90 disabled:opacity-50 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] transition-all"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? 'Saving...' : 'Save Parameters'}
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Nested Agent Modal for inline agent creation */}
      <AnimatePresence>
        {showAgentModal && (
          <AgentModal
            workspaceId={workspaceId}
            onClose={() => setShowAgentModal(false)}
            onAgentCreated={(agentId) => {
              // Auto-select the newly created agent
              setForm({ ...form, assigned_agent_id: agentId });
              setShowAgentModal(false);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
