/**
 * Settings Page
 * Configure Mission Control paths, URLs, and preferences
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Save, RotateCcw, Home, FolderOpen, Link as LinkIcon, ArrowLeft } from 'lucide-react';
import { getConfig, updateConfig, resetConfig, type MissionControlConfig } from '@/lib/config';

export default function SettingsPage() {
  const router = useRouter();
  const [config, setConfig] = useState<MissionControlConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (confirm('Reset all settings to defaults? This cannot be undone.')) {
      resetConfig();
      setConfig(getConfig());
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleChange = (field: keyof MissionControlConfig, value: string) => {
    if (!config) return;
    setConfig({ ...config, [field]: value });
  };

  if (!config) {
    return (
      <div className="min-h-[100dvh] bg-mc-bg flex items-center justify-center p-4">
        <div className="text-mc-text-secondary animate-pulse text-sm">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-mc-bg pb-[env(safe-area-inset-bottom)]">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-white/5 bg-black/60 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <button
              onClick={() => router.push('/')}
              className="p-2 hover:bg-white/10 rounded-xl text-mc-text-secondary hover:text-mc-text transition-colors"
              title="Back to Mission Control"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-mc-accent-cyan flex-shrink-0" />
            <h1 className="text-xl sm:text-2xl font-bold text-mc-text truncate">Settings</h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <button
              onClick={handleReset}
              className="px-3 sm:px-4 py-2 border border-white/10 rounded-lg hover:bg-white/5 text-mc-text-secondary text-xs sm:text-sm font-medium transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Reset Defaults</span>
              <span className="sm:hidden">Reset</span>
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 sm:px-6 py-2 bg-mc-accent-cyan text-black rounded-lg hover:bg-mc-accent-cyan/90 text-xs sm:text-sm font-medium transition-all hover:scale-105 hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
            >
              <Save className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save Changes'}</span>
              <span className="sm:hidden">{isSaving ? 'Saving' : 'Save'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Success Message */}
        {saveSuccess && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded text-green-400">
            ✓ Settings saved successfully
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded text-red-400">
            ✗ {error}
          </div>
        )}

        {/* Workspace Paths */}
        <section className="mb-6 sm:mb-8 p-5 sm:p-6 glass-panel rounded-2xl">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center filter drop-shadow">
              <FolderOpen className="w-4 h-4 text-mc-accent-cyan" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-mc-text">Workspace Paths</h2>
          </div>
          <p className="text-sm text-mc-text-secondary mb-6 leading-relaxed">
            Configure where Mission Control stores projects and deliverables.
          </p>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-mc-text mb-2">
                Workspace Base Path
              </label>
              <input
                type="text"
                value={config.workspaceBasePath}
                onChange={(e) => handleChange('workspaceBasePath', e.target.value)}
                placeholder="~/Documents/Shared"
                className="w-full glass-input px-4 py-2.5 text-sm"
              />
              <p className="text-xs text-mc-text-secondary/70 mt-2">
                Base directory for all Mission Control files. Use ~ for home directory.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-mc-text mb-2">
                Projects Path
              </label>
              <input
                type="text"
                value={config.projectsPath}
                onChange={(e) => handleChange('projectsPath', e.target.value)}
                placeholder="~/Documents/Shared/projects"
                className="w-full glass-input px-4 py-2.5 text-sm"
              />
              <p className="text-xs text-mc-text-secondary/70 mt-2">
                Directory where project folders are created. Each project gets its own folder.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-mc-text mb-2">
                Default Project Name
              </label>
              <input
                type="text"
                value={config.defaultProjectName}
                onChange={(e) => handleChange('defaultProjectName', e.target.value)}
                placeholder="mission-control"
                className="w-full glass-input px-4 py-2.5 text-sm"
              />
              <p className="text-xs text-mc-text-secondary/70 mt-2">
                Default name for new projects. Can be changed per project.
              </p>
            </div>
          </div>
        </section>

        {/* API Configuration */}
        <section className="mb-6 sm:mb-8 p-5 sm:p-6 glass-panel rounded-2xl">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center filter drop-shadow">
              <LinkIcon className="w-4 h-4 text-mc-accent-cyan" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-mc-text">API Configuration</h2>
          </div>
          <p className="text-sm text-mc-text-secondary mb-6 leading-relaxed">
            Configure Mission Control API URL for agent orchestration.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-mc-text mb-2">
                Mission Control URL
              </label>
              <input
                type="text"
                value={config.missionControlUrl}
                onChange={(e) => handleChange('missionControlUrl', e.target.value)}
                placeholder="http://localhost:4000"
                className="w-full glass-input px-4 py-2.5 text-sm"
              />
              <p className="text-xs text-mc-text-secondary/70 mt-2">
                URL where Mission Control is running. Auto-detected by default. Change for remote access.
              </p>
            </div>
          </div>
        </section>

        {/* Environment Variables Note */}
        <section className="p-5 sm:p-6 border border-mc-accent-cyan/20 bg-mc-accent-cyan/5 rounded-2xl">
          <h3 className="text-base sm:text-lg font-semibold text-mc-accent-cyan mb-3 flex items-center gap-2">
            <span>📝</span> Environment Variables
          </h3>
          <p className="text-sm text-mc-accent-cyan/80 mb-4 leading-relaxed">
            Some settings are also configurable via environment variables in <code className="px-1.5 py-0.5 bg-black/40 rounded border border-white/10 font-mono text-xs">.env.local</code>:
          </p>
          <ul className="text-sm text-mc-accent-cyan/70 space-y-2 ml-4 list-disc font-mono text-xs">
            <li><code className="text-mc-accent-cyan">MISSION_CONTROL_URL</code> <span className="text-mc-accent-cyan/50">— API URL override</span></li>
            <li><code className="text-mc-accent-cyan">WORKSPACE_BASE_PATH</code> <span className="text-mc-accent-cyan/50">— Base workspace directory</span></li>
            <li><code className="text-mc-accent-cyan">PROJECTS_PATH</code> <span className="text-mc-accent-cyan/50">— Projects directory</span></li>
            <li><code className="text-mc-accent-cyan">OPENCLAW_GATEWAY_URL</code> <span className="text-mc-accent-cyan/50">— Gateway WebSocket URL</span></li>
            <li><code className="text-mc-accent-cyan">OPENCLAW_GATEWAY_TOKEN</code> <span className="text-mc-accent-cyan/50">— Gateway auth token</span></li>
          </ul>
          <p className="text-xs text-mc-accent-cyan/60 mt-5 pt-4 border-t border-mc-accent-cyan/10">
            Environment variables take precedence over UI settings for server-side operations.
          </p>
        </section>
      </div>
    </div>
  );
}
