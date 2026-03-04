'use client';

import { useState, useMemo } from 'react';
import { Plus, ChevronRight, GripVertical, ArrowRightLeft, Clock } from 'lucide-react';
import { useMissionControl } from '@/lib/store';
import { triggerAutoDispatch, shouldTriggerAutoDispatch } from '@/lib/auto-dispatch';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import type { Task, TaskStatus } from '@/lib/types';
import { TaskModal } from './TaskModal';
import { EmptyState } from './EmptyState';
import { formatDistanceToNow } from 'date-fns';

interface MissionQueueProps {
  workspaceId?: string;
  mobileMode?: boolean;
  isPortrait?: boolean;
}

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'planning', label: 'Planning', color: 'border-t-mc-accent-purple' },
  { id: 'inbox', label: 'Inbox', color: 'border-t-mc-accent-pink' },
  { id: 'assigned', label: 'Assigned', color: 'border-t-mc-accent-yellow' },
  { id: 'in_progress', label: 'In Progress', color: 'border-t-mc-accent' },
  { id: 'testing', label: 'Testing', color: 'border-t-mc-accent-cyan' },
  { id: 'review', label: 'Review', color: 'border-t-mc-accent-purple' },
  { id: 'done', label: 'Done', color: 'border-t-mc-accent-green' },
];

export function MissionQueue({ workspaceId, mobileMode = false, isPortrait = true }: MissionQueueProps) {
  const { tasks, updateTaskStatus, addEvent } = useMissionControl();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const [mobileStatus, setMobileStatus] = useState<TaskStatus>('planning');
  const [statusMoveTask, setStatusMoveTask] = useState<Task | null>(null);

  // Keyboard shortcuts: N = new task, Escape = close modals
  const shortcuts = useMemo(() => [
    { key: 'n', handler: () => { if (!showCreateModal && !editingTask) setShowCreateModal(true); }, description: 'New task' },
    { key: 'Escape', handler: () => {
      if (statusMoveTask) setStatusMoveTask(null);
      else if (editingTask) setEditingTask(null);
      else if (showCreateModal) setShowCreateModal(false);
    }, description: 'Close modal' },
  ], [showCreateModal, editingTask, statusMoveTask]);
  useKeyboardShortcuts(shortcuts);

  const getTasksByStatus = (status: TaskStatus) => tasks.filter((task) => task.status === status);

  const updateTaskStatusWithPersist = async (task: Task, targetStatus: TaskStatus) => {
    if (task.status === targetStatus) return;

    const previousStatus = task.status;
    updateTaskStatus(task.id, targetStatus);

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus }),
      });

      if (!res.ok) {
        // Rollback optimistic update on server error
        console.error('Failed to update task status, rolling back');
        updateTaskStatus(task.id, previousStatus);
        return;
      }

      addEvent({
        id: crypto.randomUUID(),
        type: targetStatus === 'done' ? 'task_completed' : 'task_status_changed',
        task_id: task.id,
        message: `Task "${task.title}" moved to ${targetStatus}`,
        created_at: new Date().toISOString(),
      });

      if (shouldTriggerAutoDispatch(previousStatus, targetStatus, task.assigned_agent_id)) {
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
    } catch (error) {
      // Rollback optimistic update on network error
      console.error('Failed to update task status:', error);
      updateTaskStatus(task.id, previousStatus);
    }
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    if (mobileMode) return;
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, columnId: TaskStatus) => {
    if (mobileMode) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: TaskStatus) => {
    if (mobileMode) return;
    e.preventDefault();
    setDragOverColumn(null);
    if (!draggedTask || draggedTask.status === targetStatus) {
      setDraggedTask(null);
      return;
    }

    await updateTaskStatusWithPersist(draggedTask, targetStatus);
    setDraggedTask(null);
  };

  const mobileTasks = getTasksByStatus(mobileStatus);
  const totalTasks = tasks.length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden" role="region" aria-label="Task queue">
      <div className="p-3 border-b border-mc-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChevronRight className="w-4 h-4 text-mc-text-secondary" />
          <span className="text-sm font-medium uppercase tracking-wider">Task Queue</span>
          <span className="text-xs bg-mc-bg-tertiary px-2 py-0.5 rounded-full text-mc-text-secondary tabular-nums">{totalTasks}</span>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 min-h-11 bg-tm-brand text-white rounded-lg text-sm font-medium hover:bg-tm-brand-dark transition-colors shadow-glow-sm"
          aria-label="Create new task"
        >
          <Plus className="w-4 h-4" />
          New Task
        </button>
      </div>

      {!mobileMode ? (
        <div className="flex-1 flex gap-2.5 p-3 overflow-x-auto" role="list" aria-label="Task columns">
          {COLUMNS.map((column) => {
            const columnTasks = getTasksByStatus(column.id);
            const isDragTarget = dragOverColumn === column.id && draggedTask?.status !== column.id;
            return (
              <div
                key={column.id}
                role="listitem"
                aria-label={`${column.label} column with ${columnTasks.length} tasks`}
                className={`flex-1 min-w-[200px] max-w-[280px] flex flex-col bg-mc-bg rounded-xl border border-t-2 transition-all ${column.color} ${
                  isDragTarget ? 'border-tm-brand/50 bg-tm-brand/5 shadow-glow-sm' : 'border-mc-border/40'
                }`}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                <div className="px-2.5 py-2 border-b border-mc-border/30 flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-mc-text-secondary">{column.label}</span>
                  <span className="text-[11px] bg-mc-bg-tertiary px-1.5 py-0.5 rounded-md text-mc-text-secondary tabular-nums min-w-[1.5rem] text-center">{columnTasks.length}</span>
                </div>

                <div className="flex-1 overflow-y-auto p-1.5 space-y-1.5">
                  {columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onDragStart={handleDragStart}
                      onClick={() => setEditingTask(task)}
                      onMoveStatus={() => setStatusMoveTask(task)}
                      isDragging={draggedTask?.id === task.id}
                      mobileMode={false}
                      portraitMode={false}
                    />
                  ))}
                  {columnTasks.length === 0 && (
                    <div className={`text-center py-4 text-[10px] text-mc-text-secondary/50 ${isDragTarget ? 'text-tm-brand/60' : ''}`}>
                      {isDragTarget ? 'Drop here' : 'No tasks'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={`flex-1 overflow-y-auto ${isPortrait ? 'p-3 pb-[calc(1rem+env(safe-area-inset-bottom))]' : 'p-2.5 pb-[calc(0.75rem+env(safe-area-inset-bottom))]'}`}>
          <div className={`flex gap-2 overflow-x-auto ${isPortrait ? 'pb-3' : 'pb-2'}`} role="tablist" aria-label="Task status filter">
            {COLUMNS.map((column) => {
              const count = getTasksByStatus(column.id).length;
              const selected = mobileStatus === column.id;
              return (
                <button
                  key={column.id}
                  onClick={() => setMobileStatus(column.id)}
                  role="tab"
                  aria-selected={selected}
                  aria-controls={`tasks-${column.id}`}
                  className={`min-h-11 px-4 rounded-full border whitespace-nowrap transition-colors ${isPortrait ? 'text-sm' : 'text-xs'} ${
                    selected
                      ? 'bg-tm-brand text-white border-tm-brand font-medium shadow-glow-sm'
                      : 'bg-mc-bg-secondary border-mc-border text-mc-text-secondary hover:border-mc-border hover:text-mc-text'
                  }`}
                >
                  {column.label} ({count})
                </button>
              );
            })}
          </div>

          <div id={`tasks-${mobileStatus}`} role="tabpanel" className={`min-w-0 ${isPortrait ? 'space-y-3' : 'space-y-2'}`}>
            {mobileTasks.length === 0 ? (
              <div className="bg-mc-bg-secondary border border-mc-border rounded-xl">
                <EmptyState
                  icon="📋"
                  title="No tasks here"
                  description={`No tasks in ${mobileStatus.replace('_', ' ')} status`}
                  action={{ label: 'New Task', onClick: () => setShowCreateModal(true) }}
                />
              </div>
            ) : (
              mobileTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onDragStart={handleDragStart}
                  onClick={() => setEditingTask(task)}
                  onMoveStatus={() => setStatusMoveTask(task)}
                  isDragging={false}
                  mobileMode
                  portraitMode={isPortrait}
                />
              ))
            )}
          </div>
        </div>
      )}

      {showCreateModal && <TaskModal onClose={() => setShowCreateModal(false)} workspaceId={workspaceId} />}
      {editingTask && <TaskModal task={editingTask} onClose={() => setEditingTask(null)} workspaceId={workspaceId} />}

      {mobileMode && statusMoveTask && (
        <div className="fixed inset-0 z-50 bg-black/60 p-4 flex items-end sm:items-center sm:justify-center" onClick={() => setStatusMoveTask(null)} role="dialog" aria-modal="true" aria-label="Move task to different status">
          <div
            className="w-full sm:max-w-md bg-mc-bg-secondary border border-mc-border rounded-t-xl sm:rounded-xl p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-sm text-mc-text-secondary mb-1">Move task</div>
            <div className="font-medium mb-4 line-clamp-2">{statusMoveTask.title}</div>
            <div className="space-y-1.5 max-h-[50vh] overflow-y-auto">
              {COLUMNS.map((column) => {
                const isCurrent = statusMoveTask.status === column.id;
                return (
                  <button
                    key={column.id}
                    onClick={async () => {
                      await updateTaskStatusWithPersist(statusMoveTask, column.id);
                      setStatusMoveTask(null);
                    }}
                    disabled={isCurrent}
                    className={`w-full min-h-11 px-4 rounded-lg border text-left text-sm transition-colors ${
                      isCurrent
                        ? 'border-tm-brand/30 bg-tm-brand/10 text-tm-brand font-medium opacity-60'
                        : 'border-mc-border bg-mc-bg hover:border-tm-brand/30 hover:bg-tm-brand/5'
                    }`}
                  >
                    {column.label}
                    {isCurrent && <span className="text-xs ml-2">(current)</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
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
  const priorityStyles = {
    low: 'text-mc-text-secondary',
    normal: 'text-mc-accent',
    high: 'text-mc-accent-yellow',
    urgent: 'text-mc-accent-red',
  };

  const priorityDots = {
    low: 'bg-mc-text-secondary/40',
    normal: 'bg-mc-accent',
    high: 'bg-mc-accent-yellow',
    urgent: 'bg-mc-accent-red animate-pulse',
  };

  const isPlanning = task.status === 'planning';

  return (
    <div
      draggable={!mobileMode}
      onDragStart={(e) => onDragStart(e, task)}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      aria-label={`Task: ${task.title}, Priority: ${task.priority}, Status: ${task.status}`}
      className={`group bg-mc-bg-secondary border rounded-xl cursor-pointer transition-all ${
        isDragging ? 'opacity-40 scale-95 rotate-1' : 'hover:shadow-card-hover'
      } ${isPlanning ? 'border-mc-accent-purple/30 hover:border-mc-accent-purple/60' : 'border-mc-border/40 hover:border-tm-brand/40'}`}
    >
      {!mobileMode && (
        <div className="flex items-center justify-center py-1 border-b border-mc-border/20 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true">
          <GripVertical className="w-3.5 h-3.5 text-mc-text-secondary/40 cursor-grab" />
        </div>
      )}

      <div className={portraitMode ? 'p-4' : 'p-2.5'}>
        <h4 className={`font-medium leading-snug line-clamp-2 ${portraitMode ? 'text-sm mb-3' : 'text-xs mb-2'}`}>{task.title}</h4>

        {isPlanning && (
          <div className={`flex items-center gap-2 ${portraitMode ? 'mb-3 py-2 px-3' : 'mb-2 py-1.5 px-2'} bg-mc-accent-purple/10 rounded-lg border border-mc-accent-purple/20`}>
            <div className="w-2 h-2 bg-mc-accent-purple rounded-full animate-pulse flex-shrink-0" />
            <span className="text-xs text-mc-accent-purple font-medium">Continue planning</span>
          </div>
        )}

        {task.assigned_agent && (
          <div className={`flex items-center gap-2 ${portraitMode ? 'mb-3 py-1.5 px-2' : 'mb-2 py-1 px-1.5'} bg-mc-bg-tertiary/50 rounded-lg`}>
            <span className="text-sm" role="img" aria-label="Agent avatar">{(task.assigned_agent as unknown as { avatar_emoji: string }).avatar_emoji}</span>
            <span className="text-xs text-mc-text-secondary truncate">{(task.assigned_agent as unknown as { name: string }).name}</span>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-2 border-t border-mc-border/15">
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${priorityDots[task.priority]}`} />
            <span className={`text-[11px] capitalize ${priorityStyles[task.priority]}`}>{task.priority}</span>
          </div>
          <div className="flex items-center gap-1 text-mc-text-secondary/50">
            <Clock className="w-2.5 h-2.5" />
            <span className="text-[10px] tabular-nums">{formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}</span>
          </div>
        </div>

        {mobileMode && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoveStatus();
            }}
            className={`w-full min-h-11 rounded-lg border border-mc-border bg-mc-bg flex items-center justify-center gap-2 text-mc-text-secondary hover:text-mc-text hover:border-tm-brand/30 transition-colors ${portraitMode ? 'mt-3 text-sm' : 'mt-2 text-xs'}`}
            aria-label={`Move task "${task.title}" to different status`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            Move Status
          </button>
        )}
      </div>
    </div>
  );
}
