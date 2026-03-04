'use client';

import { useState, useEffect } from 'react';
import { Plus, ArrowRight, Folder, Users, CheckSquare, Trash2, AlertTriangle, Activity, Briefcase, Layout, Terminal, Box, Globe, Sparkles, Database, Shield } from 'lucide-react';
import Link from 'next/link';
import type { WorkspaceStats } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';

const iconMap: Record<string, React.ReactNode> = {
  'Folder': <Folder className="w-6 h-6" />,
  'Briefcase': <Briefcase className="w-6 h-6" />,
  'Layout': <Layout className="w-6 h-6" />,
  'Terminal': <Terminal className="w-6 h-6" />,
  'Box': <Box className="w-6 h-6" />,
  'Globe': <Globe className="w-6 h-6" />,
  'Sparkles': <Sparkles className="w-6 h-6" />,
  'Database': <Database className="w-6 h-6" />,
  'Shield': <Shield className="w-6 h-6" />,
  'Default': <Folder className="w-6 h-6" />
};

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

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center relative">
        <div className="text-center flex flex-col items-center">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-2 border-mc-accent-cyan/20 border-t-mc-accent-cyan rounded-full mb-6 shadow-[0_0_15px_rgba(6,182,212,0.5)]"
          />
          <p className="text-mc-text-secondary tracking-widest uppercase text-sm font-semibold">Initializing Command Center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent relative">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img src="/logo-icon.jpeg" alt="Teammates.ai" className="w-8 h-8 object-contain mix-blend-screen brightness-125" />
              <div>
                <h1 className="text-xl font-heading font-bold text-mc-text tracking-wide">Workspace Select</h1>
                <p className="text-xs text-mc-text-secondary">Select an active environment to enter Mission Control.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={workspaces.length > 0 ? `/workspace/${workspaces[0].slug}/activity` : '/workspace/default/activity'}
                className="min-h-11 px-5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-mc-text-secondary hover:text-mc-text transition-all flex items-center gap-2 text-sm font-medium"
              >
                <Activity className="w-4 h-4 text-mc-accent-cyan" />
                Global Activity
              </Link>
              <button
                onClick={() => setShowCreateModal(true)}
                className="min-h-11 flex items-center gap-2 px-6 bg-mc-accent-cyan text-black rounded-full font-bold hover:bg-mc-accent-cyan/90 transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]"
              >
                <Plus className="w-5 h-5" />
                New Workspace
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
        {workspaces.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24 glass-panel rounded-3xl mt-12 max-w-2xl mx-auto"
          >
            <div className="w-20 h-20 bg-mc-accent-cyan/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(6,182,212,0.1)]">
              <Folder className="w-10 h-10 text-mc-accent-cyan" />
            </div>
            <h3 className="text-2xl font-heading font-bold mb-3">No Active Workspaces</h3>
            <p className="text-mc-text-secondary mb-8 max-w-md mx-auto">
              Initialize your first isolated environment to begin deploying AI agents and assigning tasks.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-8 py-3.5 bg-mc-accent-cyan text-black rounded-full font-bold hover:bg-mc-accent-cyan/90 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)]"
            >
              Initialize Workspace
            </button>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            <AnimatePresence>
              {workspaces.map((workspace, i) => (
                <motion.div
                  key={workspace.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <WorkspaceCard 
                    workspace={workspace} 
                    onDelete={(id) => setWorkspaces(workspaces.filter(w => w.id !== id))}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
            
            {/* Add workspace card */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: workspaces.length * 0.05 }}
              onClick={() => setShowCreateModal(true)}
              className="border border-white/10 border-dashed rounded-2xl p-6 bg-white/[0.01] hover:bg-white/[0.03] hover:border-mc-accent-cyan/50 transition-all flex flex-col items-center justify-center gap-4 min-h-[200px] group overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-mc-accent-cyan/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Plus className="w-6 h-6 text-mc-accent-cyan" />
              </div>
              <span className="text-mc-text-secondary font-medium tracking-wide">Initialize New Workspace</span>
            </motion.button>
          </motion.div>
        )}
      </main>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateWorkspaceModal 
            onClose={() => setShowCreateModal(false)}
            onCreated={() => {
              setShowCreateModal(false);
              loadWorkspaces();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function WorkspaceCard({ workspace, onDelete }: { workspace: WorkspaceStats; onDelete: (id: string) => void }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleting(true);
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}`, { method: 'DELETE' });
      if (res.ok) {
        onDelete(workspace.id);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete workspace');
      }
    } catch {
      alert('Failed to delete workspace');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Convert legacy emoji to icon name if needed, or default
  const iconElement = iconMap[workspace.icon] || iconMap['Default'];
  
  return (
    <>
    <Link href={`/workspace/${workspace.slug}`} className="block h-full outline-none">
      <motion.div 
        whileHover={{ scale: 1.02, y: -4 }}
        whileTap={{ scale: 0.98 }}
        className="glass-panel rounded-2xl p-6 transition-all hover:bg-white/[0.04] hover:border-mc-accent-cyan/30 flex flex-col h-full group relative overflow-hidden min-h-[200px]"
      >
        {/* Subtle glow effect behind card */}
        <div className="absolute -inset-px bg-gradient-to-br from-mc-accent-cyan/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-md -z-10" />

        <div className="flex items-start justify-between mb-auto">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/5 rounded-xl text-mc-accent-cyan border border-white/5 shadow-inner group-hover:bg-mc-accent-cyan/10 transition-colors">
              {iconElement}
            </div>
            <div className="pt-1">
              <h3 className="font-heading font-bold text-lg text-mc-text group-hover:text-white transition-colors line-clamp-1">
                {workspace.name}
              </h3>
              <p className="text-xs text-mc-text-secondary font-mono mt-1">/{workspace.slug}</p>
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
                className="p-2 rounded-lg hover:bg-mc-accent-red/20 text-mc-text-secondary hover:text-mc-accent-red transition-all opacity-0 group-hover:opacity-100"
                title="Decommission workspace"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-6">
          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5 text-mc-accent-purple">
              <CheckSquare className="w-4 h-4" />
              <span>{workspace.taskCounts.total} Tasks</span>
            </div>
            <div className="flex items-center gap-1.5 text-mc-accent-cyan">
              <Users className="w-4 h-4" />
              <span>{workspace.agentCount} Agents</span>
            </div>
          </div>
          <motion.div 
            initial={{ x: -5, opacity: 0 }}
            whileHover={{ x: 0, opacity: 1 }}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border border-white/5"
          >
            <ArrowRight className="w-4 h-4 text-mc-accent-cyan" />
          </motion.div>
        </div>
      </motion.div>
    </Link>

    <AnimatePresence>
      {showDeleteConfirm && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
          onClick={() => setShowDeleteConfirm(false)}
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-mc-bg-secondary border border-mc-accent-red/20 shadow-[0_0_50px_rgba(239,68,68,0.1)] rounded-2xl w-full max-w-md overflow-hidden relative" 
            onClick={e => e.stopPropagation()}
          >
            <div className="h-1 bg-mc-accent-red w-full absolute top-0 left-0" />
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-mc-accent-red/10 rounded-full flex items-center justify-center shrink-0 border border-mc-accent-red/20 mt-1">
                  <AlertTriangle className="w-6 h-6 text-mc-accent-red" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-xl text-white">Decommission Workspace</h3>
                  <p className="text-sm text-mc-text-secondary mt-1">This destructive action cannot be reversed.</p>
                </div>
              </div>
              
              <div className="bg-white/5 p-4 rounded-xl border border-white/5 mb-6">
                <p className="text-mc-text">
                  Are you sure you want to permanently delete <strong className="text-white">{workspace.name}</strong>? 
                </p>
                {workspace.taskCounts.total > 0 && (
                  <p className="mt-3 text-sm flex items-start gap-2 text-mc-accent-red">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>This environment contains {workspace.taskCounts.total} active task(s). They must be cleared first.</span>
                  </p>
                )}
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-5 py-2.5 rounded-full text-sm font-medium border border-white/10 hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting || workspace.taskCounts.total > 0 || workspace.agentCount > 0}
                  className="px-5 py-2.5 bg-mc-accent-red text-white flex items-center justify-center rounded-full text-sm font-bold shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:shadow-[0_0_25px_rgba(239,68,68,0.6)] hover:bg-red-500 disabled:opacity-50 disabled:shadow-none transition-all"
                >
                  {deleting ? 'Decommissioning...' : 'Yes, Decommission'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}

function CreateWorkspaceModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Folder');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableIcons = Object.keys(iconMap).filter(k => k !== 'Default');

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
        setError(data.error || 'Failed to initialize workspace');
      }
    } catch {
      setError('Failed to initialize workspace');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="glass-panel border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-2xl w-full max-w-md overflow-hidden relative"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-mc-accent-cyan via-mc-accent-purple to-mc-accent-cyan opacity-50" />
        
        <div className="p-6 border-b border-white/5">
          <h2 className="text-xl font-heading font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-mc-accent-cyan" />
            Initialize Environment
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Icon selector */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-mc-text-secondary font-medium mb-3">Environment Blueprint</label>
            <div className="grid grid-cols-5 gap-3">
              {availableIcons.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  className={`aspect-square rounded-xl flex items-center justify-center transition-all ${
                    icon === i 
                      ? 'bg-mc-accent-cyan/10 border-2 border-mc-accent-cyan text-mc-accent-cyan shadow-[0_0_15px_rgba(6,182,212,0.2)]' 
                      : 'bg-white/5 border border-white/5 text-mc-text-secondary hover:border-mc-accent-cyan/30 hover:text-white hover:bg-white/10'
                  }`}
                  title={i}
                >
                  {iconMap[i]}
                </button>
              ))}
            </div>
          </div>

          {/* Name input */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-mc-text-secondary font-medium mb-3">Environment Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Production Servers"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 focus:outline-none focus:border-mc-accent-cyan focus:ring-1 focus:ring-mc-accent-cyan placeholder:text-mc-text-secondary/50 text-white font-medium transition-all"
              autoFocus
            />
          </div>

          {error && (
            <div className="p-3 bg-mc-accent-red/10 border border-mc-accent-red/20 rounded-lg flex items-center gap-2 text-mc-accent-red text-sm font-medium">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-full text-sm font-medium border border-white/10 hover:bg-white/5 transition-colors"
            >
              Abort
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="px-6 py-3 bg-mc-accent-cyan text-black rounded-full text-sm font-bold hover:bg-mc-accent-cyan/90 disabled:opacity-50 disabled:shadow-none shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all flex items-center justify-center"
            >
              {isSubmitting ? 'Initializing...' : 'Deploy Environment'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
