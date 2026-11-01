
'use client';

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mic, Square } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { transcribeAudio } from '@/ai/flows/transcribe-audio';
import { getAIErrorMessage } from '@/lib/utils';

type ClarificationDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  question: string;
  onSubmit: (answer: string) => Promise<void>;
  isSubmitting: boolean;
};

export function ClarificationDialog({ isOpen, onClose, question, onSubmit, isSubmitting }: ClarificationDialogProps) {
  const [answer, setAnswer] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const audioDataUri = reader.result as string;
          setIsTranscribing(true);
          try {
            const result = await transcribeAudio({ audioDataUri });
            if (result && result.transcribedText) {
              setAnswer(prev => prev ? `${prev} ${result.transcribedText}`.trim() : result.transcribedText);
            } else {
              throw new Error('Transcription failed.');
            }
          } catch (error) {
            console.error(error);
            toast({
              variant: 'destructive',
              title: 'Transcription Error',
              description: getAIErrorMessage(error),
            });
          } finally {
            setIsTranscribing(false);
          }
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Microphone Error',
        description: 'Could not access microphone. Please check your browser permissions.',
      });
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (answer.trim()) {
      onSubmit(answer);
    } else {
       toast({
        variant: 'destructive',
        title: 'No Answer',
        description: 'Please provide an answer to the question.',
      });
    }
  };
  
  const isLoading = isSubmitting || isRecording || isTranscribing;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>AI Clarification</DialogTitle>
            <DialogDescription>
              The AI needs a bit more information to perfect your journal entry.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-sm font-semibold p-3 bg-muted rounded-md">{question || 'The AI needs more details.'}</p>
            <div className="space-y-2">
              <Label htmlFor="answer">Your Answer</Label>
              <Textarea
                id="answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type or record your answer..."
                className="min-h-[100px]"
                disabled={isLoading}
              />
            </div>
             <Button
                type="button"
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                variant={isRecording ? 'destructive' : 'outline'}
                disabled={isSubmitting || isTranscribing}
              >
                {isRecording ? <Square className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
                {isRecording ? 'Stop Recording' : 'Record Answer'}
              </Button>
              {isRecording && <div className="text-sm text-center text-destructive animate-pulse">Recording...</div>}
              {isTranscribing && <div className="text-sm text-center text-primary animate-pulse">Transcribing...</div>}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>
              {isSubmitting ? 'Refining...' : 'Submit Answer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
