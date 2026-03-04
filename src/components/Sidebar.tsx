'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Network, Calendar, LineChart, Database } from 'lucide-react';

const navItems = [
    { name: 'Board', href: '/', icon: LayoutGrid },
    { name: 'Fleet', href: '/fleet', icon: Network },
    { name: 'Schedule', href: '/schedule', icon: Calendar },
    { name: 'Pipeline', href: '/pipeline', icon: LineChart },
    { name: 'Memory', href: '/memory', icon: Database },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 glass-sidebar h-screen sticky top-0 flex flex-col pt-6 pb-4 z-50">
            <div className="px-6 mb-8 flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-mc-accent flex items-center justify-center text-white font-bold text-sm shadow-sm">
                    A
                </div>
                <span className="font-heading font-bold text-xl tracking-tight text-mc-text">
                    Autensa
                </span>
            </div>

            <nav className="flex-1 px-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                    ? 'bg-mc-accent/10 text-mc-accent'
                                    : 'text-mc-text-secondary hover:text-mc-text hover:bg-mc-text-secondary/5'
                                }`}
                        >
                            <Icon className={`w-5 h-5 ${isActive ? 'text-mc-accent' : 'text-mc-text-secondary'}`} />
                            <span>{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto px-6">
                <div className="text-xs text-mc-text-secondary font-medium">
                    Teammates.ai Fleet View
                </div>
                <div className="text-[10px] text-mc-text-secondary/60 mt-1">
                    Connected to OpenClaw
                </div>
            </div>
        </aside>
    );
}
