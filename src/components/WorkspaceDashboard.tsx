'use client';

import { useState, useEffect } from 'react';
import { Plus, ArrowRight, Folder, Users, CheckSquare, Trash2, AlertTriangle, Activity, Cpu } from 'lucide-react';
import { toast } from '@/lib/toast-store';
import Link from 'next/link';
import type { WorkspaceStats } from '@/lib/types';
import { ApprovalsPanel } from './ApprovalsPanel';

export function WorkspaceDashboard() {
  const [workspaces, setWorkspaces] = useState<WorkspaceStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    try {
      const res = await fetch('/api/workspaces?stats=true');
      if (res.ok) {
        const data = await res.json();
        setWorkspaces(data);
      }
    } catch (error) {
      console.error('Failed to load workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalTasks = workspaces.reduce((sum, w) => sum + w.taskCounts.total, 0);
  const totalAgents = workspaces.reduce((sum, w) => sum + w.agentCount, 0);
  const activeTasks = workspaces.reduce((sum, w) => sum + w.taskCounts.in_progress, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-mc-bg flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-12 h-12 rounded-xl tm-gradient flex items-center justify-center mx-auto mb-4 shadow-glow animate-pulse">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <p className="text-mc-text-secondary text-sm">Loading your workspaces...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mc-bg">
      {/* Header */}
      <header className="border-b border-mc-border bg-mc-bg-secondary" role="banner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl tm-gradient flex items-center justify-center shadow-glow-sm">
                <Cpu className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">
                  Teammates<span className="text-tm-brand">.ai</span>
                </h1>
                <p className="text-xs text-mc-text-secondary hidden sm:block">AI Agent Orchestration</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={workspaces.length > 0 ? `/workspace/${workspaces[0].slug}/activity` : '/workspace/default/activity'}
                className="min-h-11 px-4 rounded-lg border border-mc-border bg-mc-bg text-mc-text-secondary hover:text-mc-text hover:bg-mc-bg-tertiary flex items-center gap-2 text-sm transition-colors"
                aria-label="View activity dashboard"
              >
                <Activity className="w-4 h-4" />
                <span className="hidden sm:inline">Activity Dashboard</span>
              </Link>
              <button
                onClick={() => setShowCreateModal(true)}
                className="min-h-11 flex items-center gap-2 px-4 bg-tm-brand text-white rounded-lg font-medium hover:bg-tm-brand-dark transition-colors shadow-glow-sm"
                aria-label="Create new workspace"
              >
                <Plus className="w-4 h-4" />
                New Workspace
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8" role="main">
        {/* Summary metrics */}
        {workspaces.length > 0 && (
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8" role="group" aria-label="Summary metrics">
            <div className="bg-mc-bg-secondary border border-mc-border rounded-xl p-3 sm:p-4">
              <div className="text-2xl sm:text-3xl font-bold text-tm-brand tabular-nums">{workspaces.length}</div>
              <div className="text-xs sm:text-sm text-mc-text-secondary mt-1">Workspaces</div>
            </div>
            <div className="bg-mc-bg-secondary border border-mc-border rounded-xl p-3 sm:p-4">
              <div className="text-2xl sm:text-3xl font-bold text-mc-accent-cyan tabular-nums">{totalAgents}</div>
              <div className="text-xs sm:text-sm text-mc-text-secondary mt-1">AI Teammates</div>
            </div>
            <div className="bg-mc-bg-secondary border border-mc-border rounded-xl p-3 sm:p-4">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold text-mc-accent-green tabular-nums">{activeTasks}</span>
                <span className="text-sm text-mc-text-secondary">/ {totalTasks}</span>
              </div>
              <div className="text-xs sm:text-sm text-mc-text-secondary mt-1">Active Tasks</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-bold mb-1">Workspaces</h2>
              <p className="text-mc-text-secondary text-sm">
                Select a workspace to manage its task queue and AI teammates
              </p>
            </div>

            {workspaces.length === 0 ? (
              <div className="text-center py-16 animate-fade-in">
                <div className="w-16 h-16 rounded-2xl tm-gradient flex items-center justify-center mx-auto mb-6 shadow-glow opacity-60">
                  <Folder className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-medium mb-2">No workspaces yet</h3>
                <p className="text-mc-text-secondary mb-6 max-w-md mx-auto">
                  Create your first workspace to start orchestrating AI teammates on your projects
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-tm-brand text-white rounded-lg font-medium hover:bg-tm-brand-dark transition-colors shadow-glow-sm"
                >
                  Create Your First Workspace
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {workspaces.map((workspace) => (
                  <WorkspaceCard
                    key={workspace.id}
                    workspace={workspace}
                    onDelete={(id) => setWorkspaces(workspaces.filter(w => w.id !== id))}
                  />
                ))}

                {/* Add workspace card */}
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="border-2 border-dashed border-mc-border rounded-xl p-6 hover:border-tm-brand/50 transition-all flex flex-col items-center justify-center gap-3 min-h-[200px] min-w-0 group"
                  aria-label="Add new workspace"
                >
                  <div className="w-12 h-12 rounded-xl bg-mc-bg-tertiary flex items-center justify-center group-hover:bg-tm-brand/10 transition-colors">
                    <Plus className="w-6 h-6 text-mc-text-secondary group-hover:text-tm-brand transition-colors" />
                  </div>
                  <span className="text-mc-text-secondary font-medium group-hover:text-mc-text transition-colors">Add Workspace</span>
                </button>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <ApprovalsPanel />
          </div>
        </div>
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateWorkspaceModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            loadWorkspaces();
          }}
        />
      )}
    </div>
  );
}

function WorkspaceCard({ workspace, onDelete }: { workspace: WorkspaceStats; onDelete: (id: string) => void }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}`, { method: 'DELETE' });
      if (res.ok) {
        onDelete(workspace.id);
      } else {
        const data = await res.json();
        setDeleteError(data.error || 'Failed to delete workspace');
        toast.error(data.error || 'Failed to delete workspace');
      }
    } catch {
      setDeleteError('Failed to delete workspace');
      toast.error('Failed to delete workspace');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Link href={`/workspace/${workspace.slug}`} aria-label={`Open workspace: ${workspace.name}`}>
        <div className="bg-mc-bg-secondary border border-mc-border rounded-xl p-4 sm:p-6 card-interactive cursor-pointer group relative min-h-[172px]">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl" role="img" aria-label="Workspace icon">{workspace.icon}</span>
              <div>
                <h3 className="font-semibold text-lg group-hover:text-tm-brand transition-colors">
                  {workspace.name}
                </h3>
                <p className="text-sm text-mc-text-secondary">/{workspace.slug}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {workspace.id !== 'default' && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowDeleteConfirm(true);
                  }}
                  className="p-1.5 rounded-lg hover:bg-mc-accent-red/20 text-mc-text-secondary hover:text-mc-accent-red transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete workspace"
                  aria-label={`Delete workspace ${workspace.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <ArrowRight className="w-5 h-5 text-mc-text-secondary group-hover:text-tm-brand transition-colors" />
            </div>
          </div>

          {/* Task/agent counts */}
          <div className="flex items-center gap-4 text-sm text-mc-text-secondary mt-4">
            <div className="flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4" />
              <span>{workspace.taskCounts.total} task{workspace.taskCounts.total !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>{workspace.agentCount} teammate{workspace.agentCount !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Activity indicator */}
          {workspace.taskCounts.in_progress > 0 && (
            <div className="mt-3 flex items-center gap-2 text-xs text-mc-accent-green">
              <span className="w-1.5 h-1.5 rounded-full bg-mc-accent-green animate-pulse" />
              {workspace.taskCounts.in_progress} in progress
            </div>
          )}
        </div>
      </Link>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-3 sm:p-4" onClick={() => setShowDeleteConfirm(false)} role="dialog" aria-modal="true" aria-label="Delete workspace confirmation">
          <div className="bg-mc-bg-secondary border border-mc-border rounded-t-xl sm:rounded-xl w-full max-w-md p-5 sm:p-6 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:pb-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-mc-accent-red/15 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-mc-accent-red" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Delete Workspace</h3>
                <p className="text-sm text-mc-text-secondary">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-mc-text-secondary mb-4">
              Are you sure you want to delete <strong className="text-mc-text">{workspace.name}</strong>?
            </p>

            {workspace.taskCounts.total > 0 && (
              <div className="mb-4 p-3 bg-mc-accent-red/10 border border-mc-accent-red/30 rounded-lg text-sm text-mc-accent-red">
                This workspace has {workspace.taskCounts.total} task(s). Delete them first before removing the workspace.
              </div>
            )}

            {deleteError && (
              <div className="mb-4 p-3 bg-mc-accent-red/10 border border-mc-accent-red/30 rounded-lg text-sm text-mc-accent-red">
                {deleteError}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteError(null); }}
                className="min-h-11 px-4 py-2 text-mc-text-secondary hover:text-mc-text rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting || workspace.taskCounts.total > 0 || workspace.agentCount > 0}
                className="min-h-11 px-4 py-2 bg-mc-accent-red text-white rounded-lg font-medium hover:bg-mc-accent-red/90 disabled:opacity-50 transition-colors"
              >
                {deleting ? 'Deleting...' : 'Delete Workspace'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CreateWorkspaceModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📁');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const icons = ['📁', '💼', '🏢', '🚀', '💡', '🎯', '📊', '🔧', '🌟', '🏠', '🤖', '⚡'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), icon }),
      });

      if (res.ok) {
        onCreated();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create workspace');
      }
    } catch {
      setError('Failed to create workspace');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-3 sm:p-4" onClick={onClose} role="dialog" aria-modal="true" aria-label="Create new workspace">
      <div className="bg-mc-bg-secondary border border-mc-border rounded-t-xl sm:rounded-xl w-full max-w-md pb-[env(safe-area-inset-bottom)] sm:pb-0" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-mc-border">
          <h2 className="text-lg font-semibold">Create New Workspace</h2>
          <p className="text-sm text-mc-text-secondary mt-1">Set up a new workspace for your AI teammates</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Icon selector */}
          <div>
            <label className="block text-sm font-medium mb-2" id="icon-label">Icon</label>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="icon-label">
              {icons.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  role="radio"
                  aria-checked={icon === i}
                  aria-label={`Select icon ${i}`}
                  className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${icon === i
                      ? 'bg-tm-brand/20 border-2 border-tm-brand shadow-glow-sm'
                      : 'bg-mc-bg border border-mc-border hover:border-tm-brand/50'
                    }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          {/* Name input */}
          <div>
            <label htmlFor="workspace-name" className="block text-sm font-medium mb-2">Name</label>
            <input
              id="workspace-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Acme Corp"
              className="w-full min-h-11 bg-mc-bg border border-mc-border rounded-lg px-4 py-2 focus:outline-none focus:border-tm-brand focus:ring-1 focus:ring-tm-brand/30 transition-colors"
              autoFocus
              maxLength={100}
              aria-describedby={error ? 'workspace-error' : undefined}
            />
          </div>

          {error && (
            <div id="workspace-error" className="text-mc-accent-red text-sm p-3 bg-mc-accent-red/10 border border-mc-accent-red/30 rounded-lg" role="alert">{error}</div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 px-4 py-2 text-mc-text-secondary hover:text-mc-text rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="min-h-11 px-6 py-2 bg-tm-brand text-white rounded-lg font-medium hover:bg-tm-brand-dark disabled:opacity-50 transition-colors shadow-glow-sm"
            >
              {isSubmitting ? 'Creating...' : 'Create Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
