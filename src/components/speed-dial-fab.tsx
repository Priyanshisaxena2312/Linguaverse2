
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckSquare, BookMarked, BrainCircuit, Languages, Plus, Mail } from 'lucide-react';
import { FloatingTodoButton } from './floating-todo-button';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMediaQuery } from '@/hooks/use-media-query';


export function SpeedDialFab({ initialTaskCount }: { initialTaskCount: number }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isTodoModalOpen, setIsTodoModalOpen] = useState(false);
    const isDesktop = useMediaQuery("(min-width: 768px)");


    const fabItems = [
        {
            href: '/contact',
            label: 'Contact Us',
            icon: Mail
        },
        {
            href: '/journal?tab=dictionary&subTab=compared-words',
            label: 'Compared Words',
            icon: Languages
        },
        {
            href: '/journal?tab=dictionary&subTab=hard-words',
            label: 'Hard Words',
            icon: BrainCircuit
        },
        {
            href: '/dictionary/view',
            label: 'My Dictionary',
            icon: BookMarked
        },
        {
            href: '#', // Placeholder for to-do modal
            onClick: () => {
                setIsOpen(false);
                setIsTodoModalOpen(true);
            },
            label: 'To-Do List',
            icon: CheckSquare,
            notificationCount: initialTaskCount,
        },
    ];

    return (
        <>
            <div className="fixed bottom-20 md:bottom-6 right-6 z-50 flex flex-col items-end gap-3">
                 <TooltipProvider>
                    {fabItems.map((item, index) => (
                         <Tooltip key={index} delayDuration={100} disableHoverableContent={!isDesktop}>
                            <TooltipTrigger asChild>
                                <div
                                    className={cn(
                                        "flex items-center gap-3 transition-all duration-300 ease-in-out transform",
                                        isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
                                    )}
                                    style={{ transitionDelay: `${isOpen ? (fabItems.length - index - 1) * 50 : 0}ms` }}
                                >
                                     {/* Visible label on mobile, tooltip on desktop */}
                                     <span className={cn("md:hidden bg-background/90 text-foreground text-sm font-medium px-3 py-1.5 rounded-md shadow-sm border", { 'hidden': !isOpen })}>
                                        {item.label}
                                     </span>
                                     <Button
                                        asChild={!!item.href && item.href !== '#'}
                                        variant="secondary"
                                        className="h-12 w-12 rounded-full shadow-lg relative"
                                        onClick={item.onClick}
                                        aria-label={item.label}
                                    >
                                        <Link href={item.href || ''}>
                                            <item.icon className="h-6 w-6" />
                                            {item.notificationCount !== undefined && item.notificationCount > 0 && (
                                                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
                                                    {item.notificationCount}
                                                </span>
                                            )}
                                        </Link>
                                    </Button>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                                <p>{item.label}</p>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                 </TooltipProvider>

                <Button
                    className="h-16 w-16 rounded-full shadow-xl transition-transform duration-300 ease-in-out"
                    onClick={() => setIsOpen(!isOpen)}
                    style={{ transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}
                    aria-expanded={isOpen}
                >
                   <Plus className="h-8 w-8 transition-opacity duration-200" />
                   <span className="sr-only">{isOpen ? 'Close actions menu' : 'Open actions menu'}</span>
                </Button>
            </div>
            
            <FloatingTodoButton
                initialTaskCount={initialTaskCount}
                isOpen={isTodoModalOpen}
                onOpenChange={setIsTodoModalOpen}
                isTriggerHidden={true}
            />
        </>
    );
}
