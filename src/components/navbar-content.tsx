

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Menu, User, Home, BookOpen, BarChart3, TrendingUp, Sparkles, LogIn, UserPlus, ShieldCheck, Upload, LogOut, Flame, PieChart, Dumbbell } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from './ui/button';
import { NavLink } from './nav-link';
import { SignOutButton } from '@/app/auth/sign-out-button';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { Badge } from './ui/badge';
import type { Profile } from '@/lib/types';
import Image from 'next/image';
import { cn } from '@/lib/utils';

type NavbarContentProps = {
  user: SupabaseUser | null;
  profile: (Pick<Profile, 'role'> & { streak?: number }) | null;
};

export function NavbarContent({ user, profile }: NavbarContentProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Paths where the navbar should be hidden
  const hiddenPaths = ['/journal/view', '/dictionary/view'];
  const isHidden = hiddenPaths.some(p => pathname.startsWith(p.replace('[id]', '')));

  const loggedInNavLinks = [
    { href: '/dashboard', label: 'New Entry', iconName: 'Home' as const },
    { href: '/journal', label: 'My Journal', iconName: 'BookOpen' as const },
    { href: '/analysis', label: 'Analysis', iconName: 'BarChart3' as const },
  ];

  const publicNavLinks = [
      { href: '/#demo', label: 'Demos', icon: Sparkles},
  ];
  
  if (isHidden) {
      return null;
  }

  const isDemoUser = user?.app_metadata?.provider === 'demo' || user?.id === '00000000-0000-0000-0000-000000000001';

  return (
    <div className="mx-auto flex h-14 w-full items-center px-4 sm:px-8">
      <Link href={user ? "/dashboard" : "/"} className="mr-6 flex items-center space-x-2 shrink-0 group">
        <Image src="/logo.jpg" alt="Linguaverse Logo" width={42} height={42} className="rounded-full transition-transform duration-300 group-hover:scale-110 shadow-sm border border-primary/10" />
        <span className="font-bold hidden sm:inline-block whitespace-nowrap font-headline text-primary text-xl">
          Linguaverse
        </span>
      </Link>
      
      <nav className="hidden md:flex items-center gap-4 text-sm lg:gap-6">
         {!user && publicNavLinks.map(link => (
             <Link key={link.href} href={link.href} className="text-foreground/60 transition-colors hover:text-foreground/80 font-medium">{link.label}</Link>
         ))}
      </nav>

      <div className="hidden md:flex items-center justify-end gap-3 lg:gap-6 flex-grow">
        {user ? (
          <>
            <nav className="flex items-center gap-4 text-[13px] lg:gap-6">
              {loggedInNavLinks.map((link) => (
                <NavLink key={link.href} href={link.href} label={link.label} iconName={link.iconName} />
              ))}
            </nav>
            <div className="flex items-center gap-3 lg:gap-4">
                 {isDemoUser && (
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs font-semibold px-2 py-0.5">
                      Reviewer Demo
                    </Badge>
                 )}
                 {profile?.streak !== undefined && (
                    <div className="flex items-center gap-1.5 text-orange-500 font-semibold" title={`Your current streak is ${profile.streak} days!`}>
                        <Flame className="h-5 w-5" />
                        <span className="text-sm">{profile.streak}</span>
                    </div>
                 )}
                 <Button asChild variant="outline" size="sm" className="border-2 border-solid border-primary h-8 px-3 text-[13px]">
                    <Link href="/dictionary/practice"><Dumbbell className="mr-2 h-4 w-4" /> Practice</Link>
                 </Button>
                 {isDemoUser ? (
                    <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-[12px] text-muted-foreground hover:text-destructive">
                      <Link href="/api/demo?action=exit"><LogOut className="mr-1 h-3.5 w-3.5" /> Exit Demo</Link>
                    </Button>
                 ) : (
                    <SignOutButton />
                 )}
                 <NavLink href="/profile" label="Profile" iconName="User" />
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="sm" className="rounded-full border-primary/40 bg-primary/10 text-primary font-bold hover:bg-primary hover:text-primary-foreground shadow-sm transition-all">
              <Link href="/api/demo?action=enter">
                <Sparkles className="mr-1.5 h-3.5 w-3.5 animate-pulse text-primary" /> Feature Demo (No Login)
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="font-semibold">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild size="sm" className="rounded-full px-5 font-bold shadow-md hover:scale-105 transition-transform">
              <Link href="/auth/signup">Get Started Free</Link>
            </Button>
          </div>
        )}
      </div>

      <div className="md:hidden flex items-center justify-end gap-3 flex-grow">
         {user ? (
          <div className="flex items-center gap-2">
             {profile?.streak !== undefined && (
                <div className="flex items-center gap-1 text-orange-500 font-semibold">
                    <Flame className="h-4 w-4" />
                    <span className="text-xs">{profile.streak}</span>
                </div>
             )}
            <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-[12px]">
                <Link href="/dictionary/practice"><Dumbbell className="mr-1.5 h-3.5 w-3.5"/>Practice</Link>
            </Button>
            {isDemoUser ? (
              <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-[12px] text-destructive">
                <Link href="/api/demo?action=exit">Exit</Link>
              </Button>
            ) : (
              <SignOutButton />
            )}
          </div>
        ) : (
           <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline" className="rounded-full border-primary/40 bg-primary/10 text-primary text-xs font-bold px-3">
              <Link href="/api/demo?action=enter">
                <Sparkles className="mr-1 h-3 w-3" /> Demo
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="font-semibold text-xs px-2">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild size="sm" className="rounded-full font-bold text-xs px-3">
              <Link href="/auth/signup">Join</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
