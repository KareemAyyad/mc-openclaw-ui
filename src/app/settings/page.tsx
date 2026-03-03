/**
 * Settings Page
 * Configure Teammates.ai paths, URLs, and preferences
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Save, RotateCcw, FolderOpen, Link as LinkIcon, ChevronLeft, Cpu, Shield, Info } from 'lucide-react';
import { getConfig, updateConfig, resetConfig, type MissionControlConfig } from '@/lib/config';

export default function SettingsPage() {
  const router = useRouter();
  const [config, setConfig] = useState<MissionControlConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    setConfig(getConfig());
  }, []);

  const handleSave = async () => {
    if (!config) return;

    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      updateConfig(config);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    resetConfig();
    setConfig(getConfig());
    setShowResetConfirm(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleChange = (field: keyof MissionControlConfig, value: string) => {
    if (!config) return;
    setConfig({ ...config, [field]: value });
  };

  if (!config) {
    return (
      <div className="min-h-screen bg-mc-bg flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-10 h-10 rounded-xl tm-gradient flex items-center justify-center mx-auto mb-3 animate-pulse">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <p className="text-mc-text-secondary text-sm">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mc-bg">
      {/* Header */}
      <div className="border-b border-mc-border bg-mc-bg-secondary sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.push('/')}
              className="min-h-11 min-w-11 p-2 hover:bg-mc-bg-tertiary rounded-lg text-mc-text-secondary transition-colors flex items-center gap-2"
              aria-label="Back to Teammates.ai"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline text-sm">Back</span>
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg tm-gradient flex items-center justify-center shadow-glow-sm">
                <Settings className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-mc-text">Settings</h1>
                <p className="text-xs text-mc-text-secondary hidden sm:block">Teammates.ai Configuration</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowResetConfirm(true)}
              className="hidden sm:flex min-h-11 px-4 py-2 border border-mc-border rounded-lg hover:bg-mc-bg-tertiary text-mc-text-secondary items-center gap-2 text-sm transition-colors"
              aria-label="Reset settings to defaults"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="min-h-11 px-4 py-2 bg-tm-brand text-white rounded-lg hover:bg-tm-brand-dark flex items-center gap-2 disabled:opacity-50 text-sm font-medium transition-colors shadow-glow-sm"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Success Message */}
        {saveSuccess && (
          <div className="p-4 bg-mc-accent-green/10 border border-mc-accent-green/30 rounded-xl text-mc-accent-green flex items-center gap-2 animate-fade-in" role="alert">
            <div className="w-5 h-5 rounded-full bg-mc-accent-green/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs">&#10003;</span>
            </div>
            Settings saved successfully
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-mc-accent-red/10 border border-mc-accent-red/30 rounded-xl text-mc-accent-red flex items-center gap-2 animate-fade-in" role="alert">
            <Shield className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Workspace Paths */}
        <section className="p-5 sm:p-6 bg-mc-bg-secondary border border-mc-border rounded-xl" aria-labelledby="workspace-paths-heading">
          <div className="flex items-center gap-2.5 mb-1">
            <FolderOpen className="w-5 h-5 text-tm-brand" />
            <h2 id="workspace-paths-heading" className="text-lg font-semibold text-mc-text">Workspace Paths</h2>
          </div>
          <p className="text-sm text-mc-text-secondary mb-5">
            Configure where Teammates.ai stores projects and deliverables.
          </p>

          <div className="space-y-5">
            <div>
              <label htmlFor="workspace-base-path" className="block text-sm font-medium text-mc-text mb-2">
                Workspace Base Path
              </label>
              <input
                id="workspace-base-path"
                type="text"
                value={config.workspaceBasePath}
                onChange={(e) => handleChange('workspaceBasePath', e.target.value)}
                placeholder="~/Documents/Shared"
                className="w-full min-h-11 px-4 py-2 bg-mc-bg border border-mc-border rounded-lg text-mc-text focus:border-tm-brand focus:ring-1 focus:ring-tm-brand/30 focus:outline-none transition-colors"
              />
              <p className="text-xs text-mc-text-secondary mt-1.5">
                Base directory for all files. Use ~ for home directory.
              </p>
            </div>

            <div>
              <label htmlFor="projects-path" className="block text-sm font-medium text-mc-text mb-2">
                Projects Path
              </label>
              <input
                id="projects-path"
                type="text"
                value={config.projectsPath}
                onChange={(e) => handleChange('projectsPath', e.target.value)}
                placeholder="~/Documents/Shared/projects"
                className="w-full min-h-11 px-4 py-2 bg-mc-bg border border-mc-border rounded-lg text-mc-text focus:border-tm-brand focus:ring-1 focus:ring-tm-brand/30 focus:outline-none transition-colors"
              />
              <p className="text-xs text-mc-text-secondary mt-1.5">
                Directory where project folders are created. Each project gets its own folder.
              </p>
            </div>

            <div>
              <label htmlFor="default-project-name" className="block text-sm font-medium text-mc-text mb-2">
                Default Project Name
              </label>
              <input
                id="default-project-name"
                type="text"
                value={config.defaultProjectName}
                onChange={(e) => handleChange('defaultProjectName', e.target.value)}
                placeholder="teammates-project"
                className="w-full min-h-11 px-4 py-2 bg-mc-bg border border-mc-border rounded-lg text-mc-text focus:border-tm-brand focus:ring-1 focus:ring-tm-brand/30 focus:outline-none transition-colors"
              />
              <p className="text-xs text-mc-text-secondary mt-1.5">
                Default name for new projects. Can be changed per project.
              </p>
            </div>
          </div>
        </section>

        {/* API Configuration */}
        <section className="p-5 sm:p-6 bg-mc-bg-secondary border border-mc-border rounded-xl" aria-labelledby="api-config-heading">
          <div className="flex items-center gap-2.5 mb-1">
            <LinkIcon className="w-5 h-5 text-tm-brand" />
            <h2 id="api-config-heading" className="text-lg font-semibold text-mc-text">API Configuration</h2>
          </div>
          <p className="text-sm text-mc-text-secondary mb-5">
            Configure the API URL for agent orchestration.
          </p>

          <div>
            <label htmlFor="mc-url" className="block text-sm font-medium text-mc-text mb-2">
              API URL
            </label>
            <input
              id="mc-url"
              type="url"
              value={config.missionControlUrl}
              onChange={(e) => handleChange('missionControlUrl', e.target.value)}
              placeholder="http://localhost:4000"
              className="w-full min-h-11 px-4 py-2 bg-mc-bg border border-mc-border rounded-lg text-mc-text focus:border-tm-brand focus:ring-1 focus:ring-tm-brand/30 focus:outline-none transition-colors"
            />
            <p className="text-xs text-mc-text-secondary mt-1.5">
              URL where Teammates.ai is running. Auto-detected by default. Change for remote access.
            </p>
          </div>
        </section>

        {/* Environment Variables Note */}
        <section className="p-5 sm:p-6 bg-tm-brand/5 border border-tm-brand/20 rounded-xl" aria-labelledby="env-vars-heading">
          <div className="flex items-center gap-2.5 mb-2">
            <Info className="w-5 h-5 text-tm-brand" />
            <h3 id="env-vars-heading" className="text-base font-semibold text-tm-brand-light">Environment Variables</h3>
          </div>
          <p className="text-sm text-mc-text-secondary mb-3">
            These settings can also be configured via environment variables in <code className="px-1.5 py-0.5 bg-mc-bg rounded text-xs font-mono">.env.local</code>:
          </p>
          <div className="space-y-1.5 text-sm">
            {[
              { key: 'MISSION_CONTROL_URL', desc: 'API URL override' },
              { key: 'WORKSPACE_BASE_PATH', desc: 'Base workspace directory' },
              { key: 'PROJECTS_PATH', desc: 'Projects directory' },
              { key: 'OPENCLAW_GATEWAY_URL', desc: 'Gateway WebSocket URL' },
              { key: 'OPENCLAW_GATEWAY_TOKEN', desc: 'Gateway auth token' },
            ].map(({ key, desc }) => (
              <div key={key} className="flex items-baseline gap-2 text-mc-text-secondary">
                <code className="text-xs font-mono text-tm-brand-light bg-mc-bg px-1.5 py-0.5 rounded">{key}</code>
                <span className="text-xs"> &mdash; {desc}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-mc-text-secondary mt-3">
            Environment variables take precedence over UI settings for server-side operations.
          </p>
        </section>

        {/* About */}
        <section className="p-5 sm:p-6 bg-mc-bg-secondary border border-mc-border rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl tm-gradient flex items-center justify-center shadow-glow-sm">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-semibold">Teammates<span className="text-tm-brand">.ai</span></div>
              <div className="text-xs text-mc-text-secondary">by Kareem Ayyad &middot; AI Agent Orchestration Platform</div>
            </div>
          </div>
        </section>

        {/* Mobile reset button */}
        <div className="sm:hidden">
          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-full min-h-11 px-4 py-2 border border-mc-border rounded-lg text-mc-text-secondary flex items-center justify-center gap-2 text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Defaults
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-3 sm:p-4" onClick={() => setShowResetConfirm(false)} role="dialog" aria-modal="true" aria-label="Confirm reset settings">
          <div className="bg-mc-bg-secondary border border-mc-border rounded-t-xl sm:rounded-xl w-full max-w-sm p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:pb-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-lg mb-2">Reset Settings?</h3>
            <p className="text-sm text-mc-text-secondary mb-6">
              All settings will be restored to their default values. This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="min-h-11 px-4 py-2 text-mc-text-secondary hover:text-mc-text rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="min-h-11 px-4 py-2 bg-mc-accent-red text-white rounded-lg font-medium hover:bg-mc-accent-red/90 transition-colors"
              >
                Reset to Defaults
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
