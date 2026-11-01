

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Wand2, Plus } from 'lucide-react';
import { AddTaskDialog } from './add-task-dialog';

export function PriorityWeaver() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <div className="flex flex-col text-center items-center justify-center p-8 border-2 border-dashed rounded-lg">
                 <h3 className="text-lg font-semibold">Ready to plan your work?</h3>
                 <p className="text-muted-foreground text-sm mt-1 mb-4">Create a new to-do list and let our AI help you prioritize.</p>
                <Button variant="default" className="w-full max-w-xs" onClick={() => setIsModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />New To-Do List
                </Button>
            </div>
            <AddTaskDialog isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
        </>
    );
}
