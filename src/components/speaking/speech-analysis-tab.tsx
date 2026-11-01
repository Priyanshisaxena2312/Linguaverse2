'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mic, Square, Loader2, RefreshCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { analyzeTextForLanguage } from '@/ai/flows/analyze-text-for-language';
import { LanguageAnalysisView } from '@/components/language-analysis-view';
import type { AnalyzeTextForLanguageOutput, SpeechRecognition, SpeechRecognitionEvent } from '@/lib/types';
import { getAIErrorMessage } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TalkingOrb } from './talking-orb';

export function SpeechAnalysisTab() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeTextForLanguageOutput | null>(null);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      const rec = new SpeechRecognitionAPI();
      rec.continuous = true;
      rec.interimResults = true;
      rec.onresult = (event: SpeechRecognitionEvent) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; ++i) {
            currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };
      rec.onerror = (e: any) => {
        console.error("Speech Recognition Error", e);
        if(e.error !== 'no-speech') {
            setIsRecording(false);
            toast({ variant: 'destructive', title: 'Recording Error', description: e.error });
        }
      };
      recognitionRef.current = rec;
    }
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, [toast]);

  const handleToggleRecording = () => {
    if (!recognitionRef.current) {
        toast({ variant: 'destructive', title: 'Not Supported', description: 'Speech recognition is not supported in this browser.' });
        return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      handleAnalyze(transcript);
    } else {
      setTranscript('');
      setAnalysisResult(null);
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const handleAnalyze = async (textToAnalyze: string) => {
      if(!textToAnalyze.trim()) {
          toast({ variant: 'destructive', title: 'Empty Recording', description: 'No speech was detected.' });
          return;
      }
      setIsAnalyzing(true);
      try {
          const result = await analyzeTextForLanguage({
              text: textToAnalyze.trim(),
              targetLanguage: 'English'
          });
          setAnalysisResult(result);
      } catch (e) {
          toast({ variant: 'destructive', title: 'Analysis Error', description: getAIErrorMessage(e) });
      } finally {
          setIsAnalyzing(false);
      }
  };

  const reset = () => {
      setTranscript('');
      setAnalysisResult(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Speech Analysis Workflow</CardTitle>
          <CardDescription>
            Speak freely. Your speech will be transcribed and analyzed for grammar and vocabulary improvements in written format.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 gap-8">
            <TalkingOrb isSpeaking={false} isListening={isRecording} className="mb-4" />
            
            <div className="text-center font-mono text-sm bg-muted p-4 rounded-md w-full min-h-[100px] h-32 overflow-y-auto whitespace-pre-wrap">
               {transcript || <span className="text-muted-foreground opacity-50">Transcription will appear here...</span>}
            </div>

            <div className="flex gap-4">
                <Button 
                    size="lg" 
                    variant={isRecording ? "destructive" : "default"}
                    onClick={handleToggleRecording}
                    disabled={isAnalyzing}
                    className="w-48"
                >
                    {isRecording ? <><Square className="mr-2 h-5 w-5 fill-current" /> Stop & Analyze</> : <><Mic className="mr-2 h-5 w-5" /> Start Recording</>}
                </Button>
                {transcript && !isRecording && (
                     <Button size="lg" variant="outline" onClick={reset} disabled={isAnalyzing}>
                         <RefreshCcw className="mr-2 h-4 w-4" /> Reset
                     </Button>
                )}
            </div>
            
            {isAnalyzing && (
                <div className="flex items-center text-primary mt-4">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    <span className="text-sm font-medium">Analyzing your speech...</span>
                </div>
            )}
        </CardContent>
      </Card>

      {analysisResult && (
        <Card className="border-t-4 border-t-primary">
            <CardHeader>
                <CardTitle>Analysis Results</CardTitle>
            </CardHeader>
            <CardContent>
                 <LanguageAnalysisView originalContent={transcript.trim()} analysis={analysisResult} />
            </CardContent>
        </Card>
      )}
    </div>
  );
}
