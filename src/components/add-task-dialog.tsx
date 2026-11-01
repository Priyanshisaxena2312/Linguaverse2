

'use client';

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PenSquare, MessageSquare, Mic, Loader2, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAIErrorMessage } from '@/lib/utils';
import { transcribeAudio } from '@/ai/flows/transcribe-audio';
import { addTodoListFromAI } from '@/app/todo/actions';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useRouter } from 'next/navigation';

type AddTaskDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

// Sub-component for AI-based Task Creation
const AiTaskCreator = ({ mode, onCancel }: { mode: 'chat' | 'voice', onCancel: () => void }) => {
    const [userInput, setUserInput] = useState('');
    const [listName, setListName] = useState('');
    const [goal, setGoal] = useState(''); // State for the optional goal
    const [isLoading, setIsLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    
    const router = useRouter();
    const { toast } = useToast();
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);

    const handleGenerate = async () => {
        if (!listName.trim()) {
             toast({ variant: 'destructive', title: 'List name is required.' });
            return;
        }
        if (!userInput.trim()) {
            toast({ variant: 'destructive', title: 'Input is required to generate tasks.' });
            return;
        }
        setIsLoading(true);
        try {
            // THE FIX: Pass the `goal` from state into the action.
            const result = await addTodoListFromAI({ userInput, listName, goal });
            if ('error' in result) {
                throw new Error(result.error);
            }
            toast({ title: `To-Do List "${result.name}" created successfully!` });
            onCancel(); // Close the dialog
            router.push(`/journal/todos/${result.id}`); // Navigate to the new list
        } catch (e) {
            toast({ variant: 'destructive', title: 'Failed to create list', description: getAIErrorMessage(e) });
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartRecording = async () => {
        setIsRecording(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mediaRecorderRef.current = recorder;
            const audioChunks: Blob[] = [];
            recorder.ondataavailable = (event) => audioChunks.push(event.data);
            recorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const audioDataUri = await new Promise<string>(resolve => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(audioBlob);
                });
                setIsLoading(true);
                const transcriptionResult = await transcribeAudio({ audioDataUri });
                setUserInput(prev => `${prev} ${transcriptionResult.transcribedText}`.trim());
                setIsLoading(false);
                stream.getTracks().forEach(track => track.stop());
            };
            recorder.start();
        } catch (e) {
            toast({ variant: 'destructive', title: 'Microphone Error', description: getAIErrorMessage(e) });
            setIsRecording(false);
        }
    };
    
    const handleStopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
    };

    return (
        <div className="space-y-4">
             <div>
                <Label htmlFor="list-name">List Name</Label>
                <Input id="list-name" value={listName} onChange={(e) => setListName(e.target.value)} placeholder="e.g., My Plan for Today" />
            </div>
             <div>
                <Label htmlFor="goal">Main Goal for Today (Optional)</Label>
                <Input id="goal" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g., Ship the new feature" />
            </div>
             {mode === 'chat' ? (
                <div>
                  <Label htmlFor="user-input">Your Plan (Brain Dump)</Label>
                  <Input id="user-input" value={userInput} onChange={(e) => setUserInput(e.target.value)} placeholder="Describe everything you need to do..." disabled={isLoading} />
                </div>
             ) : (
                <div className="flex flex-col gap-2">
                    <Label>Your Plan (Voice)</Label>
                    <Button onClick={isRecording ? handleStopRecording : handleStartRecording} variant={isRecording ? 'destructive' : 'outline'} disabled={isLoading}>
                         <Mic className="mr-2 h-4 w-4" />
                         {isRecording ? "Stop Recording" : "Start Recording"}
                    </Button>
                    {isRecording && <p className="text-center text-sm text-destructive animate-pulse">Recording...</p>}
                    {userInput && <p className="text-sm text-muted-foreground p-2 border rounded-md">Transcribed: "{userInput}"</p>}
                </div>
             )}
             <DialogFooter>
                <Button type="button" variant="ghost" onClick={onCancel}>Close</Button>
                <Button onClick={handleGenerate} disabled={isLoading || isRecording || !userInput.trim()}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                    Generate List
                </Button>
             </DialogFooter>
        </div>
    );
};


export function AddTaskDialog({ isOpen, onOpenChange }: AddTaskDialogProps) {
    const handleClose = () => onOpenChange(false);
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create a New To-Do List</DialogTitle>
                    <DialogDescription>Let AI generate a structured to-do list from your raw notes or voice input.</DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="chat" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="chat"><MessageSquare />Chat</TabsTrigger>
                        <TabsTrigger value="voice"><Mic />Voice</TabsTrigger>
                    </TabsList>
                    <TabsContent value="chat" className="pt-4">
                        <AiTaskCreator mode="chat" onCancel={handleClose} />
                    </TabsContent>
                    <TabsContent value="voice" className="pt-4">
                        <AiTaskCreator mode="voice" onCancel={handleClose} />
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
