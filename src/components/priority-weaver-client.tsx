
'use client';

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import type { TodoTask } from '@/lib/types';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { updateTaskStatus, addTask, updateTask, deleteTask } from '@/app/todo/actions';
import { useToast } from '@/hooks/use-toast';
import { MoreVertical, Pencil, Trash2, Loader2, Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';


const priorityStyles = {
    high: 'border-destructive/80 text-destructive',
    medium: 'border-yellow-500/80 text-yellow-600',
    low: 'border-sky-500/80 text-sky-600',
};

// Custom Hook for Long Press that handles both mouse and touch events
const useLongPress = (
  callback: (e: React.TouchEvent | React.MouseEvent) => void,
  { onDragStart, ms = 300 }: { onDragStart: () => void, ms?: number }
) => {
  const timeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const isLongPress = useRef(false);

  const start = useCallback((event: React.TouchEvent | React.MouseEvent) => {
    isLongPress.current = false;
    // Prevent the long press from firing if the user is scrolling or right-clicking
    if ('button' in event && event.button !== 0) return; // Ignore right-clicks

    timeout.current = setTimeout(() => {
      callback(event);
      isLongPress.current = true;
    }, ms);
  }, [callback, ms]);

  const clear = useCallback((event: React.TouchEvent | React.MouseEvent) => {
    timeout.current && clearTimeout(timeout.current);
     // Prevent click event after a long press
    if (isLongPress.current) {
        if(event.cancelable) event.preventDefault();
    }
  }, []);

  const handleMove = useCallback(() => {
    // If the finger/mouse moves, it's a drag, not a long press.
    timeout.current && clearTimeout(timeout.current);
    onDragStart();
  }, [onDragStart]);

  return {
    onMouseDown: (e: React.MouseEvent) => start(e),
    onTouchStart: (e: React.TouchEvent) => start(e),
    onMouseUp: (e: React.MouseEvent) => clear(e),
    onMouseLeave: (e: React.MouseEvent) => clear(e),
    onTouchEnd: (e: React.TouchEvent) => clear(e),
    onMouseMove: handleMove,
    onTouchMove: handleMove,
  };
};

const TaskCard = ({ task, onDragStart, onTouchStart, onLongPress, onEdit, onDelete }: { task: TodoTask, onDragStart: (e: React.DragEvent<HTMLDivElement>, taskId: string) => void, onTouchStart: (e: React.TouchEvent<HTMLDivElement>, taskId: string) => void, onLongPress: (task: TodoTask) => void, onEdit: (task: TodoTask) => void, onDelete: (task: TodoTask) => void }) => {
    const [isDragging, setIsDragging] = useState(false);
    
    const longPressEvents = useLongPress(() => {
        if (!isDragging) {
            onLongPress(task);
        }
    }, {
        onDragStart: () => setIsDragging(true)
    });
    
    const handleDragStartInternal = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
        setIsDragging(true);
        onDragStart(e, taskId);
    };
    
    const handleDragEnd = () => {
        setIsDragging(false);
    };

    return (
        <div
            id={`task-${task.id}`}
            draggable
            onDragStart={(e) => handleDragStartInternal(e, task.id)}
            onDragEnd={handleDragEnd}
            {...longPressEvents}
            onTouchStart={(e) => {
                longPressEvents.onTouchStart(e);
                onTouchStart(e, task.id);
            }}
            onTouchEnd={(e) => {
                longPressEvents.onTouchEnd(e);
                setTimeout(() => setIsDragging(false), 100);
            }}
            className="p-3 bg-card border rounded-lg shadow-sm cursor-grab active:cursor-grabbing relative group"
        >
            <p className="text-sm font-medium pr-6">{task.content}</p>
            <Badge variant="outline" className={cn("mt-2 capitalize text-xs", priorityStyles[task.priority])}>
                {task.priority}
            </Badge>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 focus:opacity-100">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => onEdit(task)}><Pencil className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(task)} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};


export function PriorityWeaverClient({ initialTasks, listId }: { initialTasks: TodoTask[], listId?: string }) {
    const [tasks, setTasks] = useState<TodoTask[]>(initialTasks);
    const [isAddOrEditModalOpen, setIsAddOrEditModalOpen] = useState(false);
    const [taskToEdit, setTaskToEdit] = useState<TodoTask | null>(null);
    const [taskToDelete, setTaskToDelete] = useState<TodoTask | null>(null);
    const [statusForNewTask, setStatusForNewTask] = useState<TodoTask['status']>('todo');
    const { toast } = useToast();
    const draggedTaskId = useRef<string | null>(null);
    const draggedElementRef = useRef<HTMLDivElement | null>(null);
    const [isMobileDragging, setIsMobileDragging] = useState(false);

    useEffect(() => {
        setTasks(initialTasks);
    }, [initialTasks]);

    // This effect adds an event listener to the document to prevent scrolling
    // when a touch drag is active.
    useEffect(() => {
        const preventScroll = (e: TouchEvent) => {
            if (isMobileDragging) {
                e.preventDefault();
            }
        };

        document.addEventListener('touchmove', preventScroll, { passive: false });

        return () => {
            document.removeEventListener('touchmove', preventScroll);
        };
    }, [isMobileDragging]);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
        e.dataTransfer.setData("taskId", taskId);
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>, newStatus: TodoTask['status']) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData("taskId");
        await updateTaskStatusHandler(taskId, newStatus);
    };
    
    const updateTaskStatusHandler = async (taskId: string, newStatus: TodoTask['status']) => {
        if (!taskId) return;
        
        const originalTasks = tasks;
        const taskToMove = originalTasks.find(t => t.id === taskId);
        if (!taskToMove || taskToMove.status === newStatus) return;

        setTasks(prevTasks => prevTasks.map(task => 
            task.id === taskId ? { ...task, status: newStatus } : task
        ));
        
        const result = await updateTaskStatus(taskId, newStatus);
        
        if ('error' in result) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update task status.'});
            setTasks(originalTasks);
        }
    }

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };
    
    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>, taskId: string) => {
        draggedTaskId.current = taskId;
        const target = e.currentTarget.cloneNode(true) as HTMLDivElement;
        
        target.style.position = 'absolute';
        target.style.pointerEvents = 'none';
        target.style.opacity = '0.8';
        target.style.zIndex = '1000';
        document.body.appendChild(target);
        draggedElementRef.current = target;
        
        const touch = e.touches[0];
        moveDraggedElement(touch.clientX, touch.clientY);
        setIsMobileDragging(true);
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        if (!draggedTaskId.current || !draggedElementRef.current) return;
        // The preventDefault call is moved to the global document listener.
        const touch = e.touches[0];
        moveDraggedElement(touch.clientX, touch.clientY);
    };

    const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
        if (!draggedTaskId.current || !draggedElementRef.current) return;

        draggedElementRef.current.style.display = 'none';
        const touch = e.changedTouches[0];
        const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
        const columnElement = dropTarget?.closest('[data-status]');

        if (columnElement) {
            const newStatus = columnElement.getAttribute('data-status') as TodoTask['status'];
            updateTaskStatusHandler(draggedTaskId.current, newStatus);
        }

        cleanupDrag();
    };

    const moveDraggedElement = (x: number, y: number) => {
        if (!draggedElementRef.current) return;
        const scrollY = window.scrollY;
        draggedElementRef.current.style.left = `${x - draggedElementRef.current.offsetWidth / 2}px`;
        draggedElementRef.current.style.top = `${y - draggedElementRef.current.offsetHeight / 2 + scrollY}px`;
    }

    const cleanupDrag = () => {
        if (draggedElementRef.current) {
            document.body.removeChild(draggedElementRef.current);
            draggedElementRef.current = null;
        }
        draggedTaskId.current = null;
        setIsMobileDragging(false);
    }
    
    const openAddModal = (status: TodoTask['status']) => {
        if (!listId) {
            toast({ variant: 'destructive', title: 'Action Not Allowed', description: 'Tasks can only be added from a specific list view, not the dashboard overview.'});
            return;
        };
        setTaskToEdit(null);
        setStatusForNewTask(status);
        setIsAddOrEditModalOpen(true);
    };

    const openEditModal = (task: TodoTask) => {
        setTaskToEdit(task);
        setIsAddOrEditModalOpen(true);
    };
    
    const handleDeleteClick = (task: TodoTask) => {
        setTaskToDelete(task);
    }

    const handleSaveTask = async (content: string, priority: TodoTask['priority']) => {
        if (taskToEdit) {
            const result = await updateTask(taskToEdit.id, content, priority);
            if ('error' in result) {
                toast({ variant: 'destructive', title: 'Update Failed', description: result.error });
            } else {
                setTasks(tasks.map(t => t.id === taskToEdit.id ? result : t));
                toast({ title: 'Task Updated' });
            }
        } else if (listId) {
            const result = await addTask(listId, content, priority);
             if ('error' in result) {
                toast({ variant: 'destructive', title: 'Add Failed', description: result.error });
            } else {
                setTasks([...tasks, result]);
                toast({ title: 'Task Added' });
            }
        }
        setIsAddOrEditModalOpen(false);
    };

    const handleDeleteTask = async () => {
        if (!taskToDelete) return;
        const result = await deleteTask(taskToDelete.id);
        if (result.error) {
            toast({ variant: 'destructive', title: 'Delete Failed', description: result.error });
        } else {
            setTasks(tasks.filter(t => t.id !== taskToDelete.id));
            toast({ title: 'Task Deleted' });
        }
        setTaskToDelete(null);
    }


    const columns = useMemo(() => ({
        todo: tasks.filter(t => t.status === 'todo'),
        inprogress: tasks.filter(t => t.status === 'inprogress'),
        done: tasks.filter(t => t.status === 'done'),
    }), [tasks]);

    return (
        <>
            <div 
                className="grid grid-cols-1 sm:grid-cols-3 gap-4 h-full"
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {(['todo', 'inprogress', 'done'] as const).map((status) => (
                <div 
                    key={status} 
                    data-status={status}
                    className="flex flex-col gap-2 p-2 bg-muted/50 rounded-lg min-h-[200px]"
                    onDrop={(e) => handleDrop(e, status)}
                    onDragOver={handleDragOver}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            openAddModal(status);
                        }
                    }}
                >
                    <h3 className="font-semibold text-sm capitalize text-center py-1">{status === 'inprogress' ? 'In Progress' : status} ({columns[status].length})</h3>
                    <div className="space-y-2 flex-grow">
                        {columns[status].map(task => 
                          <TaskCard 
                            key={task.id} 
                            task={task} 
                            onDragStart={handleDragStart} 
                            onTouchStart={handleTouchStart}
                            onLongPress={openEditModal}
                            onEdit={openEditModal}
                            onDelete={handleDeleteClick}
                          />
                        )}
                        <Button 
                            variant="ghost" 
                            className="w-full h-auto py-2 text-muted-foreground hover:bg-muted"
                            onClick={() => openAddModal(status)}
                        >
                            <Plus className="mr-2 h-4 w-4" /> Add Task
                        </Button>
                    </div>
                </div>
                ))}
            </div>

            <AddOrEditTaskDialog
                isOpen={isAddOrEditModalOpen}
                onClose={() => setIsAddOrEditModalOpen(false)}
                onSave={handleSaveTask}
                task={taskToEdit}
                onDelete={() => {
                    if (taskToEdit) {
                        setIsAddOrEditModalOpen(false);
                        setTaskToDelete(taskToEdit);
                    }
                }}
            />
            
            <AlertDialog open={!!taskToDelete} onOpenChange={(open) => !open && setTaskToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this task?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the task: "{taskToDelete?.content}". This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteTask} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}


// Sub-component for the Add/Edit Dialog
const AddOrEditTaskDialog = ({ isOpen, onClose, onSave, task, onDelete }: { isOpen: boolean, onClose: () => void, onSave: (content: string, priority: TodoTask['priority']) => void, task: TodoTask | null, onDelete: () => void }) => {
    const [content, setContent] = useState('');
    const [priority, setPriority] = useState<TodoTask['priority']>('medium');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (task) {
                setContent(task.content);
                setPriority(task.priority);
            } else {
                setContent('');
                setPriority('medium');
            }
        }
    }, [task, isOpen]);

    const handleSubmit = async () => {
        setIsLoading(true);
        await onSave(content, priority);
        setIsLoading(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{task ? 'Edit Task' : 'Add New Task'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="task-content">Content</Label>
                        <Input id="task-content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="e.g., Fix the authentication bug" />
                    </div>
                    <div>
                        <Label htmlFor="task-priority">Priority</Label>
                        <Select value={priority} onValueChange={(v: TodoTask['priority']) => setPriority(v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="low">Low</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter className="sm:justify-between">
                    {task ? (
                        <Button variant="destructive" onClick={onDelete}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </Button>
                    ) : <div></div>}
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={isLoading || !content.trim()}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {task ? 'Save Changes' : 'Add Task'}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
