import {
    Bot,
    Bug,
    Terminal,
    Search,
    PenTool,
    Palette,
    BarChart,
    Brain,
    Zap,
    Rocket,
    Target,
    Wrench,
    User,
    Cpu,
    Shield,
    type LucideIcon
} from 'lucide-react';

interface AgentAvatarProps {
    avatar?: string | null;
    className?: string;
}

// Map both legacy emojis and modern string names to Lucide icons
const ICON_MAP: Record<string, LucideIcon> = {
    // Legacy Emojis from old DB entries
    '🤖': Bot,
    '🦞': Bug,
    '💻': Terminal,
    '🔍': Search,
    '✍️': PenTool,
    '🎨': Palette,
    '📊': BarChart,
    '🧠': Brain,
    '⚡': Zap,
    '🚀': Rocket,
    '🎯': Target,
    '🔧': Wrench,

    // Modern Names
    'Bot': Bot,
    'Bug': Bug,
    'Terminal': Terminal,
    'Search': Search,
    'PenTool': PenTool,
    'Palette': Palette,
    'BarChart': BarChart,
    'Brain': Brain,
    'Zap': Zap,
    'Rocket': Rocket,
    'Target': Target,
    'Wrench': Wrench,
    'Cpu': Cpu,
    'Shield': Shield,
    'User': User,
};

export const AVAILABLE_AVATARS = [
    'Bot', 'Terminal', 'Brain', 'Zap', 'Rocket', 'Target',
    'Wrench', 'Palette', 'Search', 'PenTool', 'BarChart', 'Cpu', 'Shield'
];

export function AgentAvatar({ avatar, className = '' }: AgentAvatarProps) {
    const Icon = avatar && ICON_MAP[avatar] ? ICON_MAP[avatar] : Bot;

    return <Icon className={`w-full h-full ${className}`} />;
}
