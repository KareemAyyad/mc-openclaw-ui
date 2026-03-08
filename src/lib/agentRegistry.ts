export type AgentTeam = 'sales' | 'marketing' | 'operations' | 'engineering';

export interface AgentMeta {
    emoji: string;
    team: AgentTeam;
    heartbeat: string;
    color: string;
    lightGlow: string;
}

export interface TeamMeta {
    label: string;
    colorClass: string;
    icon: string;
    borderClass: string;
    bgClass: string;
    textClass: string;
    /** Solid background variant (no opacity), e.g. 'bg-emerald-50' */
    bgSolidClass: string;
    /** Border variant for active/selected states, e.g. 'border-emerald-200' */
    borderActiveClass: string;
    /** Ring color for focus/active rings, e.g. 'ring-emerald-500' */
    ringClass: string;
}

export const TEAMS: Record<AgentTeam, TeamMeta> = {
    sales: {
        label: 'Sales',
        colorClass: 'bg-emerald-500',
        borderClass: 'border-emerald-200/50',
        bgClass: 'bg-emerald-50/30',
        bgSolidClass: 'bg-emerald-50',
        textClass: 'text-emerald-700',
        borderActiveClass: 'border-emerald-200',
        ringClass: 'ring-emerald-500',
        icon: '💰'
    },
    marketing: {
        label: 'Marketing',
        colorClass: 'bg-indigo-500',
        borderClass: 'border-indigo-200/50',
        bgClass: 'bg-indigo-50/30',
        bgSolidClass: 'bg-indigo-50',
        textClass: 'text-indigo-700',
        borderActiveClass: 'border-indigo-200',
        ringClass: 'ring-indigo-500',
        icon: '📢'
    },
    operations: {
        label: 'Operations',
        colorClass: 'bg-amber-500',
        borderClass: 'border-amber-200/50',
        bgClass: 'bg-amber-50/30',
        bgSolidClass: 'bg-amber-50',
        textClass: 'text-amber-700',
        borderActiveClass: 'border-amber-200',
        ringClass: 'ring-amber-500',
        icon: '⚙️'
    },
    engineering: {
        label: 'Engineering',
        colorClass: 'bg-sky-500',
        borderClass: 'border-sky-200/50',
        bgClass: 'bg-sky-50/30',
        bgSolidClass: 'bg-sky-50',
        textClass: 'text-sky-700',
        borderActiveClass: 'border-sky-200',
        ringClass: 'ring-sky-500',
        icon: '🛠️'
    },
};

/** Typed array of team IDs to avoid repeated `Object.keys(TEAMS) as AgentTeam[]` casts */
export const TEAM_IDS: AgentTeam[] = Object.keys(TEAMS) as AgentTeam[];

export const AGENTS: Record<string, AgentMeta> = {
    leadgen: { emoji: '🔍', team: 'sales', heartbeat: 'Every 1h', color: 'bg-emerald-500', lightGlow: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]' },
    outbound: { emoji: '💰', team: 'sales', heartbeat: 'Every 1h', color: 'bg-blue-500', lightGlow: 'shadow-[0_0_15px_rgba(59,130,246,0.15)]' },
    content: { emoji: '✍️', team: 'marketing', heartbeat: 'Every 2h', color: 'bg-indigo-500', lightGlow: 'shadow-[0_0_15px_rgba(99,102,241,0.15)]' },
    seo: { emoji: '🔎', team: 'marketing', heartbeat: 'Every 6h', color: 'bg-teal-500', lightGlow: 'shadow-[0_0_15px_rgba(20,184,166,0.15)]' },
    intel: { emoji: '🕵️', team: 'operations', heartbeat: 'Every 4h', color: 'bg-purple-500', lightGlow: 'shadow-[0_0_15px_rgba(168,85,247,0.15)]' },
    onboarding: { emoji: '⚡', team: 'operations', heartbeat: 'Every 30m', color: 'bg-amber-500', lightGlow: 'shadow-[0_0_15px_rgba(245,158,11,0.15)]' },
    fundraise: { emoji: '🤝', team: 'operations', heartbeat: 'Every 2h', color: 'bg-rose-500', lightGlow: 'shadow-[0_0_15px_rgba(244,63,94,0.15)]' },
    finops: { emoji: '📊', team: 'operations', heartbeat: 'Every 4h', color: 'bg-orange-500', lightGlow: 'shadow-[0_0_15px_rgba(249,115,22,0.15)]' },
    devops: { emoji: '🚀', team: 'engineering', heartbeat: 'Every 2h', color: 'bg-sky-500', lightGlow: 'shadow-[0_0_15px_rgba(14,165,233,0.15)]' },
    'ai-eng': { emoji: '🧠', team: 'engineering', heartbeat: 'Every 6h', color: 'bg-violet-500', lightGlow: 'shadow-[0_0_15px_rgba(139,92,246,0.15)]' },
};

export const memoryFiles: Record<string, string[]> = {
    leadgen: ['researched-companies.jsonl', 'vertical-rotation.txt', 'exec-moves.jsonl'],
    outbound: ['active-sequences.json', 'sequence-performance.jsonl', 'templates-that-work.md'],
    content: ['content-calendar.json', 'topics-used.txt', 'performance-log.jsonl'],
    intel: ['competitor-timeline.jsonl', 'threat-register.json'],
    onboarding: ['user-journeys.jsonl', 'pql-log.jsonl'],
    fundraise: ['investor-interactions.jsonl', 'pipeline-snapshots.jsonl'],
    seo: ['serp-history.jsonl', 'keyword-targets.json'],
    finops: ['cost-log.jsonl', 'budget-config.json'],
    devops: ['api-uptime.jsonl', 'deploy-history.jsonl'],
    'ai-eng': ['performance-reviews.jsonl', 'prompt-changelog.jsonl'],
};
