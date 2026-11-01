
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, BarChart3, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Profile } from '@/lib/types';

type MobileBottomNavProps = {
  profile: Profile | null;
};

export function MobileBottomNav({ profile }: MobileBottomNavProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Entry', icon: Home },
    { href: '/journal', label: 'Journal', icon: BookOpen },
    { href: '/analysis', label: 'Analysis', icon: BarChart3 },
    { href: '/profile', label: 'Profile', icon: User },
  ];

  if (['/login', '/signup', '/'].includes(pathname)) {
    return null;
  }
  
  return (
    <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2.5rem)] max-w-sm px-2 py-2 border border-border/40 bg-background/80 backdrop-blur-md rounded-full shadow-lg safe-area-inset-bottom">
      <div className="flex items-center justify-between h-full relative">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex-1 flex flex-col items-center justify-center py-1 group"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-bubble"
                  className="absolute inset-0 bg-primary/10 rounded-full"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="relative z-10 flex flex-col items-center"
              >
                <item.icon
                  className={cn(
                    'w-5 h-5 mb-0.5 transition-colors duration-300',
                    isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
                  )}
                />
                <span className={cn(
                    "text-[10px] transition-colors duration-300",
                    isActive ? 'text-primary font-bold' : 'text-muted-foreground group-hover:text-primary'
                )}>
                  {item.label}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
