
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Mic, Square, Wand2, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import type { Profile, SpeechRecognition, SpeechRecognitionEvent } from '@/lib/types';
import { getAIErrorMessage, markdownToTiptapJson } from '@/lib/utils';
import type { JournalEntryForCreate } from '@/lib/types';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { transcribeAudio } from '@/ai/flows/transcribe-audio';

type VoiceJournalFormProps = {
  onEntryGenerated: (entry: JournalEntryForCreate, audioDataUri?: string) => Promise<void>;
  profile: Profile | null;
  isIterationMode?: boolean;
};

export function VoiceJournalForm({ onEntryGenerated, profile, isIterationMode = false }: VoiceJournalFormProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioDataUri, setAudioDataUri] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [liveTranscribedText, setLiveTranscribedText] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          interimTranscript += event.results[i][0].transcript;
        }
        if (interimTranscript) {
          setLiveTranscribedText(interimTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          toast({ variant: 'destructive', title: 'Speech Recognition Error', description: event.error });
        }
        stopRecording();
      };
      speechRecognitionRef.current = recognition;
    } else {
      toast({ variant: 'destructive', title: 'Not Supported', description: 'Speech recognition is not supported by your browser.' });
    }

    return () => {
      speechRecognitionRef.current?.abort();
      mediaRecorderRef.current?.stream?.getTracks().forEach(track => track.stop());
    };
  }, [toast]);

  const startRecording = async () => {
    setLiveTranscribedText('');
    setAudioDataUri(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const options = {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
        audioBitsPerSecond: 128000
      };

      mediaRecorderRef.current = new MediaRecorder(stream, options);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
            ? 'audio/webm;codecs=opus'
            : 'audio/webm'
        });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          setAudioDataUri(reader.result as string);
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      speechRecognitionRef.current?.start();
      setIsRecording(true);
      setRecordingTime(0);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      toast({
        variant: 'destructive',
        title: 'Microphone Error',
        description: 'Could not access microphone. Please check your browser permissions.',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleGenerateClick = async () => {
    if (!audioDataUri && !liveTranscribedText.trim()) {
      toast({ variant: 'destructive', title: 'No Audio', description: 'Please record your entry first.' });
      return;
    }
    if (!title.trim()) {
      toast({ variant: 'destructive', title: 'Title Required', description: 'Please provide a title for your entry.' });
      return;
    }

    setIsGenerating(true);

    try {
      if (!audioDataUri) throw new Error("No audio recording found.");

      // 1. Convert Data URI to Blob for upload
      const response = await fetch(audioDataUri);
      const blob = await response.blob();
      const file = new File([blob], `${title.replace(/\s+/g, '-')}.webm`, { type: 'audio/webm' });

      // 2. Upload to Storage
      const formData = new FormData();
      formData.append('file', file);

      const { uploadMedia, analyzeVoiceEntry } = await import('@/app/journal/actions');
      const uploadResult = await uploadMedia(formData);

      if (uploadResult.error) throw new Error(uploadResult.error);

      // 3. Save Entry first (to get ID)
      const contentJson = { type: 'doc', content: [{ type: 'paragraph' }] };

      // The parent component should handle the actual database insertion
      // We pass the audio details to it
      await onEntryGenerated({
        title: title,
        content: contentJson,
        is_project_log: false,
        audio_url: uploadResult.filePath,
        audio_duration: recordingTime,
      });

      // Note: Full transcription and analysis happen via analyzeVoiceEntry 
      // but we need the entry ID. The parent should handle triggering this.
      // Alternatively, we return the data and let the parent handle it.

      toast({ title: 'Recording Saved!', description: 'Your audio is being analyzed for fluency.' });

      setLiveTranscribedText('');
      setAudioDataUri(null);
      setTitle('');
      setRecordingTime(0);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Process Failed",
        description: getAIErrorMessage(err),
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (!profile) {
    return <div className="space-y-4">
      <div className="h-10 w-full bg-muted rounded-md animate-pulse"></div>
      <div className="h-20 w-full bg-muted rounded-md animate-pulse"></div>
    </div>;
  }

  return (
    <div className="space-y-6 flex-grow flex flex-col justify-between">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="spoken-title">Title</Label>
          <Input
            id="spoken-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title for your spoken entry"
            disabled={isGenerating || isRecording}
          />
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 p-6 bg-primary/5 rounded-lg">
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            size="lg"
            className="w-full sm:w-auto"
            variant={isRecording ? 'destructive' : 'default'}
            disabled={isGenerating}
          >
            {isRecording ? (
              <>
                <Square className="mr-2 h-5 w-5" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="mr-2 h-5 w-5" />
                Start Recording
              </>
            )}
          </Button>
          {isRecording && (
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 bg-destructive rounded-full animate-pulse" />
              <span className="font-mono font-bold text-xl text-destructive">{formatTime(recordingTime)}</span>
            </div>
          )}
        </div>

        {liveTranscribedText && (
          <div className="p-4 border rounded-2xl bg-muted/50">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">Live Preview</p>
            <p className="text-sm">{liveTranscribedText}</p>
          </div>
        )}

        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" /> AI Improvement: {profile.ai_improvement_enabled !== false ? 'Enabled' : 'Disabled'}
            </span>
            <Button variant="ghost" size="sm" asChild className="h-7 text-[10px] text-muted-foreground hover:text-primary">
              <Link href="/profile">Change in Settings</Link>
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            {profile.ai_improvement_enabled !== false
              ? "AI will automatically refine your grammar and vocabulary when saving."
              : "AI assistance is turned off. Your raw thoughts will be saved for pure practice."}
            <span className="block mt-1 italic font-semibold text-primary/70">💡 Learning Tip: Disabling this helps you learn to formulate correct sentences independently!</span>
          </p>
        </div>
      </div>

      {audioDataUri && !isRecording && (
        <div className="space-y-2 text-center">
          <audio src={audioDataUri} controls className="w-full" />
          <p className="text-xs text-muted-foreground">Recorded audio for AI processing.</p>
        </div>
      )}

      <Button onClick={handleGenerateClick} disabled={isGenerating || isRecording || (!audioDataUri && !liveTranscribedText.trim()) || !title.trim()} className="w-full">
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Saving Entry...
          </>
        ) : (
          <>
            <Wand2 className="mr-2 h-5 w-5 opacity-80" />
            Save Entry
          </>
        )}
      </Button>
    </div>
  );
}
