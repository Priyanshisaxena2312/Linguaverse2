'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Hand, Pause, Play, Square, Loader2, BarChart3, Clock, Target, Zap, CheckCircle2, Info, Plus } from "lucide-react";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { saveAudioChunk, clearAudioDB } from "@/lib/audio-db";
import { generateSpeakingPracticeResponse, generateSpeakingReportAction } from "@/ai/flows/generate-new-speaking-response";
import { TurnAnalysis } from "@/ai/flows/speaking-types";
import { saveSpeakingSessionAction } from '@/app/journal/actions';
import { getAIErrorMessage, cn } from '@/lib/utils';
import { TalkingOrb } from './talking-orb';
import { useGeminiLive } from '@/hooks/use-gemini-live';
import type { SpeakingReportOutput } from '@/ai/flows/speaking-types';
import { AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { SpeechRecognition, SpeechRecognitionEvent } from '@/lib/types';

type Message = {
    role: 'user' | 'assistant';
    content: string;
    audioUrl?: string;
    isAudioOnly?: boolean;
    speaker?: string;
};

const PRACTICE_MODES = [
    { id: 'Random', title: 'Random Topic', desc: 'A spontaneous chat about a random topic.' },
    { id: 'Debate', title: 'Debate', desc: 'Debate a controversial topic against a skilled AI opponent.' },
    { id: 'Jam Session', title: 'Jam Session', desc: 'Quick-fire questions to practice thinking on your feet.' },
    { id: 'Group Discussion', title: 'Group Discussion', desc: 'Human vs 4 AI interview panel. Requires age > 8.' },
];

const VOICES = [
    { id: 'Callirrhoe', label: 'Callirrhoe (Female)' },
    { id: 'Aoede', label: 'Aoede (Female)' },
    { id: 'Puck', label: 'Puck (Male)' },
    { id: 'Charon', label: 'Charon (Male)' },
];

const ACCENTS = [
    { id: 'American', label: '🇺🇸 American' },
    { id: 'British', label: '🇬🇧 British' },
    { id: 'Australian', label: '🇦🇺 Australian' },
    { id: 'Indian', label: '🇮🇳 Indian' },
];

export function SpeakingPracticeTab({ userAge }: { userAge?: number | null }) {
    const [step, setStep] = useState(1); // 1 = Setup, 2 = Active
    
    const [mode, setMode] = useState<string>('Random');
    const [topic, setTopic] = useState('');
    const [voice, setVoice] = useState<string>('Callirrhoe');
    const [accent, setAccent] = useState<string>('en-US');
    const [formality, setFormality] = useState<'informal' | 'formal'>('informal');
    
    const [messages, setMessages] = useState<Message[]>([]);
    type SessionState = 'idle' | 'listening' | 'processing' | 'speaking' | 'paused';
    const [sessionState, setSessionState] = useState<SessionState>('idle');
    
    const audioPlayerRef = useRef<HTMLAudioElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const startTimeRef = useRef<number>(0);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const [showTranscript, setShowTranscript] = useState(false);
    const [report, setReport] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [allTurnAnalyses, setAllTurnAnalyses] = useState<TurnAnalysis[]>([]);
    const [silenceDuration, setSilenceDuration] = useState(0);
    const [isSilent, setIsSilent] = useState(false);
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const { toast } = useToast();

    const { connected, status, connect, disconnect, startMic, stopMic, sendText, volume } = useGeminiLive({
        mode,
        topic,
        accent,
        voice,
        formality,
        onTranscript: (text, isFinal) => {
            if (isFinal) {
                setMessages(prev => {
                    // Avoid duplicate greetings or empty texts
                    if (!text || text === 'Hello! I am ready to start.') return prev;
                    return [...prev, { role: 'assistant', content: text }];
                });
            }
        },
        onError: (err) => {
            toast({ variant: 'destructive', title: 'Live Error', description: err });
            setSessionState('idle');
        }
    });

    const handleSendText = (text: string) => {
        if (sendText(text)) {
            setMessages(prev => [...prev, { role: 'user', content: text }]);
        }
    };

    // Auto-scroll logic
    useEffect(() => {
        const viewport = scrollAreaRef.current?.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
        }
    }, [messages]);

    // Legacy logic removed to favor Gemini 3.1 Live API

    useEffect(() => {
        const player = audioPlayerRef.current;
        if (!player) return;

        const handlePlay = () => setSessionState('speaking');
        const handleEnded = () => setSessionState('listening');
        const handlePause = () => {
            if (sessionState === 'speaking') setSessionState('paused');
        };
        
        player.addEventListener('play', handlePlay);
        player.addEventListener('ended', handleEnded);
        player.addEventListener('pause', handlePause);
        player.onerror = () => {
            console.error("Audio playback error detected. Resetting state.");
            setSessionState('listening');
        };

        return () => {
            player.removeEventListener('play', handlePlay);
            player.removeEventListener('ended', handleEnded);
            player.removeEventListener('pause', handlePause);
        };
    }, [sessionState]);

    const handleStart = () => {
        setStep(2);
        setMessages([]);
        setSessionState('listening');
        connect();
    };

    const handleEndSession = async () => {
        setSessionState('idle');
        disconnect();

        setIsSaving(true);
        try {
            console.log("End session requested. Mode:", mode, "Topic:", topic);
            console.log("History turns:", messages.length, "Analyzed turns:", allTurnAnalyses.length);

            const reportData = await generateSpeakingReportAction({
                chatHistory: messages.map(m => ({ role: m.role, content: m.content })),
                topic: topic || 'Surprise Me',
                practiceType: mode,
                allTurnAnalyses
            });
            
            console.log("Report response received:", reportData);

            if ('error' in reportData) {
                console.error("Report generation server error:", reportData.error);
                throw new Error(reportData.error);
            }
            
            setReport(reportData);
            setStep(3);
            
            // Clean up Audio DB
            await clearAudioDB();

            // Auto-save removed - user will save manually from report screen

        } catch (e) {
            console.error("CRITICAL END SESSION ERROR:", e);
            toast({ 
                variant: 'destructive', 
                title: 'Report Generation Failed', 
                description: "We had trouble analyzing your session. Please check your internet and try again." 
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveToJournal = async () => {
        if (!report) return;
        setIsSaving(true);
        try {
            await saveSpeakingSessionAction({
                practiceType: mode,
                topic: topic || 'Surprise Me',
                chatHistory: messages.map(m => ({ role: m.role, content: m.content })),
                report: report
            });
            toast({
                title: "Saved Successfully",
                description: "Your speaking session has been added to your journal."
            });
        } catch (e) {
            toast({
                variant: "destructive",
                title: "Save Failed",
                description: "Could not save session. Please try again."
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleInterrupt = () => {
        if (audioPlayerRef.current) audioPlayerRef.current.pause();
        setSessionState('listening');
    };

    const handlePauseResume = () => {
        if (sessionState === 'listening') {
            stopMic();
            setSessionState('paused');
        } else if (sessionState === 'paused') {
            startMic();
            setSessionState('listening');
        }
    };

    if (step === 1) {
        return (
            <ScrollArea className="h-[calc(100vh-150px)] w-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto py-8 px-4">
                    {/* Left Side: Modes */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-headline italic tracking-tighter">Choose Your Challenge</h2>
                            <p className="text-muted-foreground">Select a practice mode to improve specific speaking skills.</p>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {PRACTICE_MODES.map((m) => (
                                <button
                                    key={m.id}
                                    onClick={() => setMode(m.id)}
                                    className={cn(
                                        "text-left p-6 rounded-3xl border-2 transition-all duration-300 group relative overflow-hidden",
                                        mode === m.id 
                                            ? "border-primary bg-primary/5 shadow-xl shadow-primary/10 ring-4 ring-primary/5" 
                                            : "border-muted bg-card hover:border-primary/50 hover:bg-muted/50"
                                    )}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-bold text-lg">{m.title}</h3>
                                        {mode === m.id && <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />}
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed">{m.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right Side: Options */}
                    <div className="space-y-6">
                        <Card className="rounded-[40px] p-2 border-0 shadow-2xl bg-gradient-to-tr from-card to-muted/30">
                            <CardContent className="p-8 space-y-8">
                                <div className="space-y-4">
                                    <Label className="text-sm font-bold uppercase tracking-widest opacity-50">Topic (Optional)</Label>
                                    <Input 
                                        placeholder="e.g. Travel, AI, Job Interview..." 
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        className="rounded-2xl h-14 bg-background border-2 focus-visible:ring-primary/20"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <Label className="text-sm font-bold uppercase tracking-widest opacity-50">Voice</Label>
                                        <Select value={voice} onValueChange={setVoice}>
                                            <SelectTrigger className="h-14 rounded-2xl bg-background border-2">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {VOICES.map(v => <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-4">
                                        <Label className="text-sm font-bold uppercase tracking-widest opacity-50">Accent</Label>
                                        <Select value={accent} onValueChange={setAccent}>
                                            <SelectTrigger className="h-14 rounded-2xl bg-background border-2">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ACCENTS.map(a => <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <Label className="text-sm font-bold uppercase tracking-widest opacity-50">Interaction Tone</Label>
                                    <Select value={formality} onValueChange={(v: any) => setFormality(v)}>
                                        <SelectTrigger className="h-14 rounded-2xl bg-background border-2 focus-visible:ring-primary/20">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="informal">Relaxed & Conversational</SelectItem>
                                            <SelectItem value="formal">Strict & Professional</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="pt-4 border-t border-dashed">
                                    <Button size="lg" className="w-full h-16 rounded-3xl text-lg font-bold shadow-xl shadow-primary/20 transition-transform hover:scale-[1.02]" onClick={handleStart}>
                                        Start Practice Session
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </ScrollArea>
        );
    }

    if (step === 3 && report) {
        return (
            <Card className="border-0 shadow-lg bg-gradient-to-b from-background to-primary/5 overflow-hidden">
                <CardHeader className="text-center border-b bg-background/50 backdrop-blur-md sticky top-0 z-20">
                    <div className="flex justify-center mb-2">
                        <div className="p-3 bg-primary/10 rounded-full">
                            <BarChart3 className="h-8 w-8 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-headline italic tracking-tight">Performance Report</CardTitle>
                    <CardDescription>Session Analysis for {mode} ({topic || 'Surprise Me'})</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-8 max-w-4xl mx-auto">
                    {/* Summary Header */}
                    <div className="bg-primary/10 p-6 rounded-2xl border border-primary/20 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Target className="h-24 w-24 text-primary" />
                        </div>
                        <h3 className="text-lg font-bold mb-2 flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-primary" /> Executive Summary</h3>
                        <p className="text-muted-foreground italic leading-relaxed z-10 relative">"{report.overallSummary}"</p>
                    </div>

                    {/* Scores Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { label: 'Fluency', score: report.fluency.score, icon: Clock, color: 'text-blue-500', data: report.fluency },
                            { label: 'Grammar', score: report.grammar.score, icon: Target, color: 'text-purple-500', data: report.grammar },
                            { label: 'Confidence', score: report.confidence.score, icon: Zap, color: 'text-amber-500', data: report.confidence },
                        ].map((metric) => (
                            <div key={metric.label} className="space-y-4 p-5 rounded-2xl border bg-card/50 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={cn("p-2 rounded-lg bg-opacity-10", metric.color.replace('text', 'bg'))}>
                                            <metric.icon className={cn("h-5 w-5", metric.color)} />
                                        </div>
                                        <span className="font-bold">{metric.label}</span>
                                    </div>
                                    <span className={cn("text-2xl font-black", metric.color)}>{metric.score}<span className="text-xs text-muted-foreground font-normal">/100</span></span>
                                </div>
                                <Progress value={metric.score} className="h-2" />
                            </div>
                        ))}
                    </div>

                    {/* Teacher's Review Section */}
                    {report.teacherReview && (
                        <div className="bg-card border rounded-3xl p-8 space-y-6 shadow-sm border-primary/20">
                            <div className="flex items-center justify-between border-b pb-4">
                                <h3 className="text-xl font-bold italic font-headline">Teacher's Private Review</h3>
                                <div className="flex gap-2">
                                    {report.teacherReview.wasToThePoint ? (
                                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">To The Point</span>
                                    ) : (
                                        <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Often Vague</span>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <p className="text-muted-foreground leading-relaxed text-lg italic">
                                    "{report.teacherReview.summary}"
                                </p>
                                <div className="p-6 bg-muted/50 rounded-2xl border border-dashed text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                                    {report.teacherReview.detailedFeedback}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Meta Section */}
                    <div className="border-t pt-8">
                        <div className="flex items-start gap-4 p-5 rounded-2xl bg-muted/30 border border-dashed">
                            <div className="p-2 bg-background rounded-full shadow-sm">
                                <Info className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-sm font-bold opacity-70 uppercase tracking-widest">How we calculated this</h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">{report.parametersUsed}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Button 
                            size="lg" 
                            className="w-full sm:w-48 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20" 
                            onClick={handleSaveToJournal}
                            disabled={isSaving}
                        >
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                            Save to Journal
                        </Button>
                        <Button variant="outline" size="lg" className="w-full sm:w-48" onClick={() => { setReport(null); setStep(1); setMessages([]); setSessionState('idle'); }}>
                            New Session
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="min-h-[600px] h-[calc(100vh-250px)] max-h-[800px] flex flex-col border-0 shadow-lg relative overflow-hidden bg-gradient-to-b from-background to-muted/20 max-w-4xl mx-auto">
            <CardHeader className="border-b bg-background/50 backdrop-blur-sm z-10 flex flex-row items-center justify-between px-6 py-4">
                <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                        {mode}
                        {isSilent && <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse uppercase tracking-tighter">Silence Penalty</span>}
                    </CardTitle>
                    <CardDescription>{topic ? `Topic: ${topic}` : 'Open conversation'}</CardDescription>
                </div>
                <div className="flex items-center gap-4">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowTranscript(!showTranscript)}
                        className="text-xs text-muted-foreground hover:text-primary transition-colors h-8"
                    >
                        {showTranscript ? "Hide Transcript" : "Show Transcript"}
                    </Button>
                    <div className={cn("text-xs font-semibold flex items-center gap-2", 
                        sessionState === 'listening' ? (isSilent ? 'text-red-500' : 'text-green-500') : 
                        sessionState === 'processing' ? 'text-blue-500' : 'text-muted-foreground')}>
                        {(sessionState === 'listening' || sessionState === 'speaking') && (
                            <div className={cn("w-2 h-2 rounded-full animate-pulse", isSilent ? 'bg-red-500 shadow-[0_0_8px_red]' : 'bg-current')} />
                        )}
                        {sessionState === 'listening' ? (isSilent ? 'DON\'T STOP!' : 'Listening...') : 
                        sessionState === 'processing' ? 'Thinking...' : 
                        sessionState === 'speaking' ? 'Speaking...' : 'Paused'}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-grow p-0 flex flex-col relative z-10 overflow-hidden">
                <div className="flex-grow flex flex-col items-center justify-center relative min-h-0">
                    {/* Visual Orb area */}
                    <div className={cn(
                        "transition-all duration-700 ease-in-out flex flex-col items-center justify-center w-full min-h-0",
                        showTranscript ? "h-1/3" : "h-full"
                    )}>
                        <div className="flex flex-col items-center justify-center py-8">
                            <TalkingOrb 
                                isSpeaking={sessionState === 'speaking'} 
                                isListening={sessionState === 'listening'}
                                volume={volume}
                                colors={isSilent ? ['from-red-600', 'via-red-400', 'to-red-800'] : undefined}
                            />
                        </div>
                    </div>
                    
                    {/* Chat area (Transcript) */}
                    <ScrollArea className={cn(
                        "w-full transition-all duration-700 ease-in-out border-t bg-black/5",
                        showTranscript ? "h-2/3 opacity-100" : "h-0 opacity-0 overflow-hidden border-0"
                    )} ref={scrollAreaRef}>
                        <div className="space-y-4 max-w-2xl mx-auto p-6">
                            {messages.filter(m => m.content !== 'Hello! I am ready to start.').map((msg, idx) => (
                                <div key={idx} className={cn("flex items-start gap-3", msg.role === 'user' ? "justify-end" : "justify-start")}>
                                    <div className={cn("rounded-2xl px-4 py-2.5 max-w-[85%] text-sm", 
                                        msg.role === 'user' 
                                            ? "bg-primary text-primary-foreground rounded-tr-sm" 
                                            : "bg-card border shadow-sm rounded-tl-sm text-foreground"
                                    )}>
                                        <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>

                <div className="p-4 bg-background/80 backdrop-blur-md border-t flex flex-col gap-3">
                    <form 
                        onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const text = formData.get('fallbackText') as string;
                            if (text) {
                                handleSendText(text);
                                e.currentTarget.reset();
                            }
                        }}
                        className="flex w-full max-w-3xl mx-auto gap-2"
                    >
                        <Input 
                            name="fallbackText" 
                            placeholder="Type to reply if microphone is unavailable..." 
                            disabled={sessionState === 'processing' || sessionState === 'speaking'} 
                            className="bg-background h-10 rounded-xl"
                        />
                        <Button type="submit" disabled={sessionState === 'processing' || sessionState === 'speaking'} className="h-10 rounded-xl">
                            Send
                        </Button>
                    </form>
                    
                    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
                        <Button
                            size="lg"
                            className="w-full sm:w-32 h-12 rounded-2xl shadow-sm"
                            variant="secondary"
                            onClick={handleInterrupt}
                            disabled={sessionState !== 'speaking'}
                        >
                            <Hand className="mr-2 h-4 w-4" /> Interrupt
                        </Button>
                        <Button
                            size="lg"
                            className={cn("w-full sm:w-40 h-12 rounded-2xl shadow-md transition-all", 
                                sessionState === 'listening' ? "bg-primary hover:bg-primary/90" : "bg-muted"
                            )}
                            variant={sessionState === 'listening' ? 'default' : 'outline'}
                            onClick={handlePauseResume}
                            disabled={sessionState === 'processing'}
                        >
                            {sessionState === 'listening' ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                            {sessionState === 'listening' ? 'Pause Mic' : 'Resume Mic'}
                        </Button>
                        <Button 
                            variant="destructive" 
                            size="lg" 
                            className="w-full sm:w-32 h-12 rounded-2xl shadow-sm" 
                            onClick={handleEndSession}
                            disabled={sessionState === 'processing'}
                        >
                            <Square className="mr-2 h-4 w-4 fill-current" /> End
                        </Button>
                    </div>
                </div>
                <audio ref={audioPlayerRef} className="hidden" />
            </CardContent>
        </Card>
    );
}
