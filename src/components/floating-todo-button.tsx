'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { CheckSquare, ListTodo, Plus, ArrowLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import type { TodoList } from '@/lib/types';
import { ScrollArea } from './ui/scroll-area';
import { AddTaskDialog } from './add-task-dialog';
import { getTodoLists, getTodoListById } from '@/app/todo/actions';
import { usePathname } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { PriorityWeaverClient } from './priority-weaver-client';
import { Skeleton } from './ui/skeleton';

type FloatingTodoButtonProps = {
    initialTaskCount: number;
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    isTriggerHidden?: boolean;
};

export function FloatingTodoButton({ initialTaskCount, isOpen, onOpenChange, isTriggerHidden = false }: FloatingTodoButtonProps) {
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [lists, setLists] = useState<TodoList[]>([]);
    const [selectedList, setSelectedList] = useState<TodoList | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [taskCount, setTaskCount] = useState(initialTaskCount);
    const pathname = usePathname();
    
    const isMainModalOpen = isOpen !== undefined ? isOpen : internalIsOpen;
    const setIsMainModalOpen = onOpenChange || setInternalIsOpen;

    useEffect(() => {
        setTaskCount(initialTaskCount);
    }, [initialTaskCount]);
    
    const activeLists = useMemo(() => {
        return lists.filter(list => {
            if (list.tasks.length === 0) return true;
            return list.tasks.some(task => task.status !== 'done');
        });
    }, [lists]);

    const fetchAllLists = async () => {
        setIsLoading(true);
        const result = await getTodoLists();
        if ('error' in result) {
            console.error(result.error);
        } else {
            setLists(result);
            const newCount = result.reduce((sum, list) => {
                return sum + list.tasks.filter(t => t.status !== 'done').length;
            }, 0);
            setTaskCount(newCount);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        if (isMainModalOpen) {
            fetchAllLists();
        } else {
            setSelectedList(null);
        }
    }, [isMainModalOpen]);

    useEffect(() => {
        if (isMainModalOpen) {
            setIsMainModalOpen(false);
        }
    }, [pathname]);

    const handleSelectList = async (listId: string) => {
        setIsLoading(true);
        const result = await getTodoListById(listId);
        if ('error' in result) {
            console.error(result.error);
        } else {
            setSelectedList(result);
        }
        setIsLoading(false);
    };

    const handleBackToLists = () => {
        setSelectedList(null);
        fetchAllLists();
    };

    const TodoListCard = ({ list }: { list: TodoList }) => {
        const totalTasks = list.tasks.length;
        const completedTasks = list.tasks.filter(t => t.status === 'done').length;

        return (
            <Card className="hover:shadow-md hover:border-primary/50 transition-all cursor-pointer" onClick={() => handleSelectList(list.id)}>
                <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-semibold">{list.name}</h3>
                            <p className="text-xs text-muted-foreground">Created: {format(new Date(list.created_at), 'PPP')}</p>
                        </div>
                        <Badge variant="outline">{completedTasks}/{totalTasks} done</Badge>
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <>
            {!isTriggerHidden && (
                <Button
                    className="fixed bottom-20 right-4 md:bottom-6 md:right-6 h-14 w-14 rounded-full shadow-lg z-50 flex items-center justify-center"
                    onClick={() => setIsMainModalOpen(true)}
                >
                    <CheckSquare className="h-7 w-7" />
                    <span className="sr-only">Open To-Do List</span>
                    {taskCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
                            {taskCount}
                        </span>
                    )}
                </Button>
            )}

            <Dialog open={isMainModalOpen} onOpenChange={setIsMainModalOpen}>
                <DialogContent className="max-w-xl h-[80vh] flex flex-col">
                    <DialogHeader>
                        {selectedList ? (
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleBackToLists}>
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                                <div>
                                    <DialogTitle>{selectedList.name}</DialogTitle>
                                    <DialogDescription>Drag tasks to change their status.</DialogDescription>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <DialogTitle>My To-Do Lists</DialogTitle>
                                <DialogDescription>Quickly jump to a list or create a new one.</DialogDescription>
                            </div>
                        )}
                    </DialogHeader>

                    {isLoading ? (
                         <div className="flex-grow space-y-3 p-1">
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                        </div>
                    ) : selectedList ? (
                        <div className="flex-grow overflow-hidden -mx-6 px-6">
                            <ScrollArea className="h-full pr-2">
                                <PriorityWeaverClient initialTasks={selectedList.tasks} listId={selectedList.id} />
                            </ScrollArea>
                        </div>
                    ) : (
                        <div className="flex-grow overflow-hidden -mx-6 px-6">
                            <ScrollArea className="h-full pr-2">
                                {activeLists.length > 0 ? (
                                    <div className="space-y-3">
                                        {activeLists.map(list => <TodoListCard key={list.id} list={list} />)}
                                    </div>
                                ) : (
                                    <div className="text-center text-muted-foreground flex flex-col items-center justify-center h-full">
                                        <ListTodo className="h-10 w-10 mb-2" />
                                        <p>No active to-do lists.</p>
                                        <p className="text-xs">Completed lists are hidden here.</p>
                                    </div>
                                )}
                            </ScrollArea>
                        </div>
                    )}
                    
                    {!selectedList && (
                        <div className="pt-4 border-t">
                            <Button className="w-full" onClick={() => { setIsMainModalOpen(false); setIsAddModalOpen(true); }}>
                                <Plus className="mr-2 h-4 w-4" /> New To-Do List
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <AddTaskDialog isOpen={isAddModalOpen} onOpenChange={setIsAddModalOpen} />
        </>
    );
}
