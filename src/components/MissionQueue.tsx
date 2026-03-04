'use client';

import { useState } from 'react';
import { Plus, ChevronRight, GripVertical, ArrowRightLeft, Clock } from 'lucide-react';
import { useMissionControl } from '@/lib/store';
import { triggerAutoDispatch, shouldTriggerAutoDispatch } from '@/lib/auto-dispatch';
import type { Task, TaskStatus } from '@/lib/types';
import { TaskModal } from './TaskModal';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { AgentAvatar } from '@/components/AgentAvatar';

interface MissionQueueProps {
  workspaceId?: string;
  mobileMode?: boolean;
  isPortrait?: boolean;
}

const COLUMNS: { id: TaskStatus; label: string; color: string; glow: string }[] = [
  { id: 'planning', label: '📋 Planning', color: 'from-mc-accent-purple/20', glow: 'border-t-mc-accent-purple/50 shadow-[0_-2px_10px_rgba(139,92,246,0.1)]' },
  { id: 'inbox', label: 'Inbox', color: 'from-mc-accent-pink/20', glow: 'border-t-mc-accent-pink/50 shadow-[0_-2px_10px_rgba(236,72,153,0.1)]' },
  { id: 'assigned', label: 'Assigned', color: 'from-mc-accent-yellow/20', glow: 'border-t-mc-accent-yellow/50 shadow-[0_-2px_10px_rgba(245,158,11,0.1)]' },
  { id: 'in_progress', label: 'In Progress', color: 'from-mc-accent-cyan/20', glow: 'border-t-mc-accent-cyan/50 shadow-[0_-2px_10px_rgba(34,211,238,0.1)]' },
  { id: 'testing', label: 'Testing', color: 'from-mc-accent-purple/20', glow: 'border-t-mc-accent-purple/50 shadow-[0_-2px_10px_rgba(139,92,246,0.1)]' },
  { id: 'review', label: 'Review', color: 'from-mc-accent-purple/20', glow: 'border-t-mc-accent-purple/50 shadow-[0_-2px_10px_rgba(139,92,246,0.1)]' },
  { id: 'done', label: 'Done', color: 'from-mc-accent-green/20', glow: 'border-t-mc-accent-green/50 shadow-[0_-2px_10px_rgba(16,185,129,0.1)]' },
];

export function MissionQueue({ workspaceId, mobileMode = false, isPortrait = true }: MissionQueueProps) {
  const { tasks, updateTaskStatus, addEvent } = useMissionControl();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [mobileStatus, setMobileStatus] = useState<TaskStatus>('planning');
  const [statusMoveTask, setStatusMoveTask] = useState<Task | null>(null);

  const getTasksByStatus = (status: TaskStatus) => tasks.filter((task) => task.status === status);

  const updateTaskStatusWithPersist = async (task: Task, targetStatus: TaskStatus) => {
    if (task.status === targetStatus) return;

    updateTaskStatus(task.id, targetStatus);

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus }),
      });

      if (res.ok) {
        addEvent({
          id: crypto.randomUUID(),
          type: targetStatus === 'done' ? 'task_completed' : 'task_status_changed',
          task_id: task.id,
          message: `Task "${task.title}" moved to ${targetStatus}`,
          created_at: new Date().toISOString(),
        });

        if (shouldTriggerAutoDispatch(task.status, targetStatus, task.assigned_agent_id)) {
          const result = await triggerAutoDispatch({
            taskId: task.id,
            taskTitle: task.title,
            agentId: task.assigned_agent_id,
            agentName: task.assigned_agent?.name || 'Unknown Agent',
            workspaceId: task.workspace_id,
          });

          if (!result.success) {
            console.error('Auto-dispatch failed:', result.error);
          }
        }
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
      updateTaskStatus(task.id, task.status);
    }
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    if (mobileMode) return;
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (mobileMode) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: TaskStatus) => {
    if (mobileMode) return;
    e.preventDefault();
    if (!draggedTask || draggedTask.status === targetStatus) {
      setDraggedTask(null);
      return;
    }

    await updateTaskStatusWithPersist(draggedTask, targetStatus);
    setDraggedTask(null);
  };

  const mobileTasks = getTasksByStatus(mobileStatus);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-transparent">
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-black/10 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-mc-accent-cyan/10 rounded border border-mc-accent-cyan/20">
            <ChevronRight className="w-4 h-4 text-mc-accent-cyan" />
          </div>
          <span className="text-sm font-heading font-bold uppercase tracking-widest text-white">Mission Queue</span>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 min-h-10 bg-mc-accent-cyan text-black rounded-full text-sm font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] transition-all hover:bg-mc-accent-cyan/90"
        >
          <Plus className="w-4 h-4" />
          New Task
        </button>
      </div>

      {!mobileMode ? (
        <div className="flex-1 flex gap-4 p-6 overflow-x-auto min-h-0">
          {COLUMNS.map((column) => {
            const columnTasks = getTasksByStatus(column.id);
            return (
              <div
                key={column.id}
                className={`flex-1 min-w-[280px] max-w-[320px] flex flex-col glass-panel rounded-2xl border-t-2 relative overflow-hidden ${column.glow}`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {/* Subtle gradient wash at the top of the column */}
                <div className={`absolute top-0 left-0 w-full h-24 bg-gradient-to-b ${column.color} to-transparent opacity-20 pointer-events-none`} />

                <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between relative z-10">
                  <span className="text-xs font-heading font-bold uppercase tracking-wider text-white">{column.label}</span>
                  <span className="text-xs font-mono bg-white/10 px-2 py-0.5 rounded-full text-mc-text-secondary border border-white/5">{columnTasks.length}</span>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-3 relative z-10">
                  <AnimatePresence>
                    {columnTasks.map((task) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <TaskCard
                          task={task}
                          onDragStart={handleDragStart}
                          onClick={() => setEditingTask(task)}
                          onMoveStatus={() => setStatusMoveTask(task)}
                          isDragging={draggedTask?.id === task.id}
                          mobileMode={false}
                          portraitMode={false}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={`flex-1 overflow-y-auto ${isPortrait ? 'p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]' : 'p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]'}`}>
          <div className={`flex gap-2 overflow-x-auto ${isPortrait ? 'pb-4' : 'pb-3'} scrollbar-hide`}>
            {COLUMNS.map((column) => {
              const count = getTasksByStatus(column.id).length;
              const selected = mobileStatus === column.id;
              return (
                <button
                  key={column.id}
                  onClick={() => setMobileStatus(column.id)}
                  className={`min-h-12 px-5 rounded-full border whitespace-nowrap transition-all ${isPortrait ? 'text-sm' : 'text-xs'} ${selected
                    ? 'bg-mc-accent-cyan/20 text-mc-accent-cyan border-mc-accent-cyan/50 font-bold shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                    : 'glass-panel text-mc-text-secondary border-white/5 hover:bg-white/5'
                    }`}
                >
                  {column.label} <span className="ml-1 opacity-60 font-mono">({count})</span>
                </button>
              );
            })}
          </div>

          <div className={`min-w-0 ${isPortrait ? 'space-y-4' : 'space-y-3'}`}>
            <AnimatePresence>
              {mobileTasks.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-mc-text-secondary glass-panel rounded-xl p-6 text-center"
                >
                  No active missions in this sector.
                </motion.div>
              ) : (
                mobileTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <TaskCard
                      task={task}
                      onDragStart={handleDragStart}
                      onClick={() => setEditingTask(task)}
                      onMoveStatus={() => setStatusMoveTask(task)}
                      isDragging={false}
                      mobileMode
                      portraitMode={isPortrait}
                    />
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showCreateModal && <TaskModal onClose={() => setShowCreateModal(false)} workspaceId={workspaceId} />}
        {editingTask && <TaskModal task={editingTask} onClose={() => setEditingTask(null)} workspaceId={workspaceId} />}
      </AnimatePresence>

      <AnimatePresence>
        {mobileMode && statusMoveTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm p-4 flex items-end sm:items-center sm:justify-center"
            onClick={() => setStatusMoveTask(null)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full sm:max-w-md glass-panel border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] rounded-t-2xl sm:rounded-2xl p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6 sm:hidden" />
              <div className="text-xs uppercase tracking-widest text-mc-accent-cyan font-bold mb-2">Relocate Mission</div>
              <div className="font-medium mb-6 line-clamp-2 text-white text-lg">{statusMoveTask.title}</div>
              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {COLUMNS.map((column) => (
                  <button
                    key={column.id}
                    onClick={async () => {
                      await updateTaskStatusWithPersist(statusMoveTask, column.id);
                      setStatusMoveTask(null);
                    }}
                    disabled={statusMoveTask.status === column.id}
                    className="w-full min-h-12 px-4 rounded-xl border border-white/5 bg-white/5 hover:bg-mc-accent-cyan/10 hover:border-mc-accent-cyan/30 text-left text-sm disabled:opacity-30 disabled:hover:bg-white/5 disabled:hover:border-white/5 transition-all flex items-center justify-between group"
                  >
                    <span className="text-white group-hover:text-mc-accent-cyan transition-colors">{column.label}</span>
                    {statusMoveTask.status === column.id && <span className="text-xs bg-white/10 px-2 rounded-full">Current</span>}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface TaskCardProps {
  task: Task;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onClick: () => void;
  onMoveStatus: () => void;
  isDragging: boolean;
  mobileMode: boolean;
  portraitMode?: boolean;
}

function TaskCard({ task, onDragStart, onClick, onMoveStatus, isDragging, mobileMode, portraitMode = true }: TaskCardProps) {
  const priorityStyles: Record<string, string> = {
    low: 'text-mc-text-secondary bg-white/5 border border-white/10',
    normal: 'text-mc-accent-cyan bg-mc-accent-cyan/10 border border-mc-accent-cyan/20',
    high: 'text-mc-accent-yellow bg-mc-accent-yellow/10 border border-mc-accent-yellow/20',
    urgent: 'text-mc-accent-red bg-mc-accent-red/10 border border-mc-accent-red/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]',
  };

  const priorityDots: Record<string, string> = {
    low: 'bg-mc-text-secondary/50',
    normal: 'bg-mc-accent-cyan',
    high: 'bg-mc-accent-yellow',
    urgent: 'bg-mc-accent-red animate-pulse',
  };

  const isPlanning = task.status === 'planning';

  return (
    <div
      draggable={!mobileMode}
      onDragStart={(e) => onDragStart(e, task)}
      onClick={onClick}
      className={`group bg-black/40 backdrop-blur-md rounded-xl cursor-pointer transition-all hover:bg-white/[0.04] ${isDragging ? 'opacity-40 scale-95 border-dashed border-2' : 'border border-white/10'
        } ${isPlanning ? 'border-mc-accent-purple/30 hover:border-mc-accent-purple/60' : 'hover:border-mc-accent-cyan/40 hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)]'}`}
    >
      {!mobileMode && (
        <div className="flex items-center justify-center pt-2 pb-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-8 h-1 bg-white/10 rounded-full cursor-grab hover:bg-white/20" />
        </div>
      )}

      <div className={`${portraitMode ? 'p-4' : 'p-3'} ${!mobileMode ? 'pt-1' : ''}`}>
        <h4 className={`font-medium leading-snug line-clamp-2 text-mc-text group-hover:text-white transition-colors ${portraitMode ? 'text-sm mb-3' : 'text-xs mb-3'}`}>
          {task.title}
        </h4>

        {isPlanning && (
          <div className={`flex items-center gap-2 ${portraitMode ? 'mb-3 py-2 px-3' : 'mb-3 py-1.5 px-2.5'} bg-mc-accent-purple/20 rounded-lg border border-mc-accent-purple/30 shadow-[0_0_10px_rgba(139,92,246,0.1)]`}>
            <div className="w-2 h-2 bg-mc-accent-purple rounded-full animate-pulse flex-shrink-0" />
            <span className="text-xs text-mc-accent-purple font-medium tracking-wide">Synthesizing plan...</span>
          </div>
        )}

        {task.assigned_agent && (
          <div className={`flex items-center gap-2 ${portraitMode ? 'mb-4 py-2 px-3' : 'mb-3 py-1.5 px-2'} glass-panel border-white/5 rounded-lg`}>
            <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center shadow-inner">
              <AgentAvatar avatar={(task.assigned_agent as unknown as { avatar_emoji: string }).avatar_emoji} className="w-3.5 h-3.5 text-white/90" />
            </div>
            <span className="text-[11px] font-medium text-white tracking-wide truncate">{(task.assigned_agent as unknown as { name: string }).name}</span>
          </div>
        )}

        <div className={`flex items-center justify-between gap-2 pt-3 border-t border-white/5 mt-auto`}>
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${priorityStyles[task.priority] || priorityStyles.normal}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${priorityDots[task.priority] || priorityDots.normal}`} />
            <span className="text-[10px] uppercase font-bold tracking-widest">{task.priority}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-mono text-mc-text-secondary/70">
            <Clock className="w-3 h-3" />
            {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
          </div>
        </div>

        {mobileMode && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoveStatus();
            }}
            className={`w-full min-h-11 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center gap-2 text-white font-medium hover:bg-white/10 hover:border-white/20 transition-colors ${portraitMode ? 'mt-4 text-sm' : 'mt-3 text-xs'}`}
          >
            <ArrowRightLeft className="w-4 h-4 text-mc-accent-cyan" />
            Transfer
          </button>
        )}
      </div>
    </div>
  );
}
