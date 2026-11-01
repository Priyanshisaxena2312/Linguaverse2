

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, BookOpen, BarChart3, User, type LucideIcon, ShieldCheck, Upload, PieChart } from 'lucide-react';
import type { ComponentType, MouseEventHandler } from 'react';

const icons = {
    Home,
    BookOpen,
    BarChart3,
    User,
    ShieldCheck,
    PieChart,
};

type NavLinkProps = {
    href: string;
    label: string;
    iconName: keyof typeof icons;
    onClick?: MouseEventHandler<HTMLAnchorElement>;
};

export function NavLink({ href, label, iconName, onClick }: NavLinkProps) {
    const pathname = usePathname();
    const isActive = pathname === href;
    const Icon = icons[iconName];

    return (
        <Link
            href={href}
            onClick={onClick}
            className={cn(
            'transition-all duration-200 hover:text-foreground/80 hover:scale-105 flex items-center gap-2',
            isActive ? 'text-foreground' : 'text-foreground/60'
            )}
        >
            <Icon className={cn("h-4 w-4", isActive ? "text-primary": "text-foreground/60")} />
            {label}
        </Link>
    );
}
