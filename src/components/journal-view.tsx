
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { JournalEntry, Plan, Profile, Theme, PageStyle, LogIteration, Assignment } from '@/lib/types';
import { THEMES, PAGE_STYLES } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { FileDown, PlusCircle, BarChart2, Smile, Zap, Lightbulb, Edit, Save, XCircle, Info, Loader2, Tag, Star, FileText, Trash2, MessageSquare, Bot, BookOpenCheck, Languages, Sparkles, Upload, Quote, Play, Timer, AlertCircle, Mic2 } from 'lucide-react';
import { AnalysisChart } from './analysis-chart';
import { getAndSaveFullAnalysis, submitEntry, submitToAssignment } from '@/app/journal/[id]/actions';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './ui/skeleton';
import { Input } from './ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Label } from './ui/label';
import { updateEntry, addLogIteration, getProjectReport, updateLogIteration, deleteLogIteration, getSignedUrls, analyzeVoiceEntry } from '@/app/journal/actions';
import type { AnalyzeJournalEntryOutput } from '@/lib/types';
import Link from 'next/link';
import { DeleteEntryButton } from './delete-entry-button';
import { getHashtagsFromTiptapJson, cn, getAIErrorMessage, getPlainTextFromTiptapJson, convertSignedUrlsToStoragePaths, markdownToTiptapJson, tiptapJsonToHtml, ensureTiptapJson, sanitizeTiptapJson, sanitizeHtml } from '@/lib/utils';
import { Badge } from './ui/badge';
import { getProfile } from '@/app/profile/actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import jsPDF from 'jspdf';
import { TiptapEditor } from './rich-text-editor';
import { format } from 'date-fns';
import { AudioPlayer } from './audio-player';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogFooter
} from '@/components/ui/alert-dialog';
import { ScrollArea } from './ui/scroll-area';
import { AddIterationDialog } from './add-iteration-dialog';
import { JournalChat } from './journal-chat';
import { LanguageAnalysisView } from './language-analysis-view';
import { getAnalyzedEntries } from '@/app/journal/actions';
import { setCachedData, clearCachedData } from '@/lib/idb-cache';

type AnalysisType = 'personal' | 'language';
type PersonalAnalysisSubtype = 'sentiment' | 'mood' | 'productivity' | 'creativity';
type LanguageAnalysisSubtype = 'grammaticalAccuracy' | 'vocabularyRichness' | 'fluencyAndCohesion';

const analysisExplanations: Record<AnalysisType, string> = {
  personal: "The AI analyzes the emotional tone, identifies moods, and estimates the productivity and creativity expressed in the text.",
  language: "The AI assesses your writing for grammatical accuracy, vocabulary richness, and overall fluency, providing scores to track your language learning progress.",
};

type JournalViewProps = {
  entry: JournalEntry;
  profile: Profile;
  plan: Plan;
  formattedDate: string;
  assignments?: Assignment[];
};

export function JournalView({ entry, profile, plan, formattedDate, assignments = [] }: JournalViewProps) {
  const [currentEntry, setCurrentEntry] = useState(entry);
  const [activeAnalysis, setActiveAnalysis] = useState<AnalysisType | null>('language');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [avgGrammarScore, setAvgGrammarScore] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);

  const [editedTitle, setEditedTitle] = useState(currentEntry.title);
  const [editedContent, setEditedContent] = useState(currentEntry.content);
  const [editedTheme, setEditedTheme] = useState<Theme>(currentEntry.theme || 'default');
  const [editedPageStyle, setEditedPageStyle] = useState<PageStyle>(currentEntry.page_style || 'default');

  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<string | null>(null);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);

  const [iterationToEdit, setIterationToEdit] = useState<LogIteration | null>(null);
  const [isAddOrEditDialogOpen, setIsAddOrEditDialogOpen] = useState(false);
  const [iterationToDelete, setIterationToDelete] = useState<LogIteration | null>(null);

  const router = useRouter();
  const { toast } = useToast();
  const journalContentRef = useRef<HTMLDivElement>(null);
  const reportContentRef = useRef<HTMLDivElement>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);



  useEffect(() => {
    setCurrentEntry(entry);
    setEditedTitle(entry.title);
    setEditedContent(entry.content);
    setEditedTheme(entry.theme || 'default');
    setEditedPageStyle(entry.page_style || 'default');

    // Cache the individual entry for offline/faster access
    if (entry) {
      setCachedData('student_journals', `entry_${entry.id}`, entry);
    }

    if (entry.audio_url) {
      setIsAudioLoading(true);
      getSignedUrls([entry.audio_url]).then(urls => {
        if (urls[entry.audio_url!]) {
          setAudioUrl(urls[entry.audio_url!]);
        }
        setIsAudioLoading(false);
      });
    }

    // Auto-trigger voice analysis if missing
    if (entry.source === 'voice' && !entry.speaking_analysis && !isAnalyzing) {
      handleVoiceAnalysis();
    }
  }, [entry]);

  useEffect(() => {
    async function fetchAvgScore() {
      const allEntries = await getAnalyzedEntries();
      const entriesWithScore = allEntries.filter(e => e.analysis?.language?.grammaticalAccuracy !== undefined);
      if (entriesWithScore.length > 0) {
        const total = entriesWithScore.reduce((sum, e) => sum + (e.analysis!.language!.grammaticalAccuracy || 0), 0);
        setAvgGrammarScore(total / entriesWithScore.length);
      }
    }
    fetchAvgScore();
  }, [entry.id]);

  useEffect(() => {
    if (!isAddOrEditDialogOpen) {
      setIterationToEdit(null);
    }
  }, [isAddOrEditDialogOpen]);

  const handleOpenEditDialog = (iteration: LogIteration) => {
    setIterationToEdit({
      ...iteration,
      content: sanitizeTiptapJson(iteration.content),
    });
    setIsAddOrEditDialogOpen(true);
  };

  const handleOpenAddDialog = () => {
    setIterationToEdit(null);
    setIsAddOrEditDialogOpen(true);
  };

  const handleJournalExport = async (format: 'txt' | 'pdf') => {
    const date = new Date(currentEntry.created_at).toISOString().split('T')[0];
    const filename = `journal-entry-${date}`;

    if (format === 'txt') {
      const plainText = getPlainTextFromTiptapJson(currentEntry.content);
      const blob = new Blob([`Title: ${currentEntry.title}\nDate: ${formattedDate}\n\n${plainText}`], { type: 'text/plain' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === 'pdf') {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const margin = 15;
      const usableWidth = pdfWidth - (margin * 2);

      pdf.setFontSize(22).setFont('times', 'bold');
      pdf.text(currentEntry.title, margin, margin + 5);

      pdf.setFontSize(10).setFont('helvetica', 'normal');
      pdf.text(formattedDate, margin, margin + 12);

      const htmlContent = tiptapJsonToHtml(currentEntry.content);

      const styledHtml = `
          <div style="font-family: sans-serif; line-height: 1.6; color: black;">
            <style>
              body { color: black; }
              img {
                max-width: 100%;
                height: auto;
                display: block;
                margin-top: 8px;
                margin-bottom: 8px;
              }
            </style>
            ${htmlContent}
          </div>
        `;

      await pdf.html(styledHtml, {
        callback: function (doc) {
          doc.save(`${filename}.pdf`);
        },
        x: margin,
        y: margin + 20,
        width: usableWidth,
        windowWidth: 700,
        autoPaging: 'text',
      });
    }
  };

  const handleReportExport = async (format: 'txt' | 'pdf') => {
    if (!generatedReport) return;
    const date = new Date().toISOString().split('T')[0];
    const filename = `project-report-${currentEntry.title.replace(/\s+/g, '-')}-${date}`;

    if (format === 'txt') {
      const blob = new Blob([generatedReport], { type: 'text/plain' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === 'pdf') {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const margin = 15;
      const usableWidth = pdf.internal.pageSize.getWidth() - (margin * 2);

      const htmlContent = tiptapJsonToHtml(markdownToTiptapJson(generatedReport));
      const styledHtml = `<div style="color: black;">${htmlContent}</div>`;

      await pdf.html(styledHtml, {
        callback: function (doc) {
          doc.save(`${filename}.pdf`);
        },
        x: margin,
        y: margin,
        width: usableWidth,
        windowWidth: 700,
        autoPaging: 'text',
      });
    }
  };

  const fetchFullAnalysis = async (type: AnalysisType) => {
    setIsAnalyzing(true);
    try {
      const plainTextContent = getPlainTextFromTiptapJson(currentEntry.content);
      const result = await getAndSaveFullAnalysis(
        currentEntry.id,
        plainTextContent,
        currentEntry.analysis,
        type,
        avgGrammarScore ?? undefined
      );
      if (result) {
        if ('error' in result) {
          toast({ variant: 'destructive', title: 'Analysis Failed', description: result.error });
        } else {
          setCurrentEntry(prev => ({
            ...prev,
            analysis: result.analysis,
            language_analysis: result.language_analysis
          }));
          if (!activeAnalysis) setActiveAnalysis(type);
          toast({ title: "Analysis Complete!", description: "Your entry has been analyzed." })
          router.refresh();
        }
      } else {
        throw new Error('Analysis returned no data.');
      }
    } catch (error) {
      console.error('Error getting and saving full analysis:', error);
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: getAIErrorMessage(error),
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalysisToggle = (type: AnalysisType) => {
    if (activeAnalysis === type) {
      setActiveAnalysis(null);
    } else {
      setActiveAnalysis(type);
      if (type === 'personal' && !currentEntry.analysis?.personal) {
        fetchFullAnalysis(type);
      } else if (type === 'language' && !currentEntry.analysis?.language) {
        fetchFullAnalysis(type);
      }
    }
  };

  const formatChartData = (
    data: Partial<AnalyzeJournalEntryOutput> | null,
    type: PersonalAnalysisSubtype | LanguageAnalysisSubtype
  ): any[] => {
    if (!data) return [];

    switch (type) {
      case 'sentiment':
        return data.personal?.sentiment ? [
          { name: 'Positive', value: data.personal.sentiment.positive, fill: 'hsl(var(--chart-2))' },
          { name: 'Negative', value: data.personal.sentiment.negative, fill: 'hsl(var(--destructive))' },
          { name: 'Neutral', value: data.personal.sentiment.neutral, fill: 'hsl(var(--muted-foreground))' },
        ] : [];
      case 'mood':
        const moodColors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];
        return data.personal?.mood?.breakdown ? data.personal.mood.breakdown.map((m, i) => ({
          name: m.mood,
          value: m.percentage,
          fill: moodColors[i % moodColors.length],
        })) : [];
      case 'productivity':
        return data.personal?.productivity !== undefined ? [{ name: 'Productivity', value: data.personal.productivity, fill: 'hsl(var(--chart-3))' }] : [];
      case 'creativity':
        return data.personal?.creativity !== undefined ? [{ name: 'Creativity', value: data.personal.creativity, fill: 'hsl(var(--chart-5))' }] : [];
      case 'grammaticalAccuracy':
        return data.language?.grammaticalAccuracy !== undefined ? [{ name: 'Grammar', value: data.language.grammaticalAccuracy, fill: 'hsl(var(--chart-1))' }] : [];
      case 'vocabularyRichness':
        return data.language?.vocabularyRichness !== undefined ? [{ name: 'Vocabulary', value: data.language.vocabularyRichness, fill: 'hsl(var(--chart-2))' }] : [];
      case 'fluencyAndCohesion':
        return data.language?.fluencyAndCohesion !== undefined ? [{ name: 'Fluency', value: data.language.fluencyAndCohesion, fill: 'hsl(var(--chart-4))' }] : [];
      default:
        return [];
    }
  };

  const handleEdit = () => {
    setEditedTitle(currentEntry.title);
    setEditedContent(currentEntry.content);
    setEditedTheme(currentEntry.theme || 'default');
    setEditedPageStyle(currentEntry.page_style || 'default');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const contentToSave = convertSignedUrlsToStoragePaths(editedContent);

    const updated = await updateEntry({
      id: currentEntry.id,
      title: editedTitle,
      content: contentToSave,
      theme: editedTheme,
      page_style: editedPageStyle,
    });

    if (updated) {
      setIsEditing(false);
      toast({
        title: "Entry Saved",
        description: "Your journal entry has been updated. Re-analyze for new insights.",
      });
      await clearCachedData('student_journals', 'latest_list');
      await clearCachedData('student_journals', `entry_${currentEntry.id}`);
      router.refresh();
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save your changes. Please try again.",
      });
    }
    setIsSaving(false);
  };

  const handleAddIteration = async (entry: Partial<Omit<JournalEntry, "source" | "id" | "created_at" | "user_id">>) => {
    if (!entry.content) return;
    const result = await addLogIteration(currentEntry.id, entry.content);
    if (result.error) {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    } else {
      toast({ title: 'Success', description: 'Update added to your entry.' });
      router.refresh();
    }
  };

  const handleUpdateIteration = async (iterationId: string, entry: Partial<Omit<JournalEntry, "source" | "id" | "created_at" | "user_id">>) => {
    if (!entry.content) return;
    const result = await updateLogIteration(currentEntry.id, iterationId, entry.content);
    if (result.error) {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    } else {
      toast({ title: 'Success', description: 'Project update has been modified.' });
      router.refresh();
    }
  };

  const handleDeleteIteration = async (iterationId: string) => {
    const result = await deleteLogIteration(currentEntry.id, iterationId);
    if (result.error) {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    } else {
      toast({ title: 'Success', description: 'Project update has been deleted.' });
      setIterationToDelete(null);
      router.refresh();
    }
  };

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    const result = await getProjectReport(currentEntry);
    if ('error' in result) {
      toast({ variant: 'destructive', title: 'Report Failed', description: result.error });
    } else {
      setGeneratedReport(result.report);
      setIsReportDialogOpen(true);
    }
    setIsGeneratingReport(false);
  };

  const handleVoiceAnalysis = async () => {
    if (!audioUrl) return;
    if (isAnalyzing) return;
    setIsAnalyzing(true);

    try {
      const analysisPromise = analyzeVoiceEntry(currentEntry.id, audioUrl!);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('slow-internet')), 60000)
      );

      const result: any = await Promise.race([analysisPromise, timeoutPromise]);

      if (result.error) {
        throw new Error(result.error);
      }

      setCurrentEntry(prev => ({
        ...prev,
        speaking_analysis: result.analysis,
        content: markdownToTiptapJson(result.analysis.transcribedText)
      }));

      toast({ title: 'Analysis Complete', description: 'Your spoken performance has been evaluated.' });

    } catch (error: any) {
      console.error("Spoken analysis error:", error);
      const message = error.message === 'slow-internet'
        ? "Internet is slow, try analyzing again later."
        : getAIErrorMessage(error);

      toast({ variant: 'destructive', title: 'Analysis Failed', description: message });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSimpleSubmit = async () => {
    setIsSubmitting(true);
    const result = await submitEntry(currentEntry.id);
    if (result.error) {
      toast({ variant: 'destructive', title: 'Submission Failed', description: result.error });
    } else {
      toast({ title: 'Entry Submitted!', description: 'Your entry has been submitted for review.' });
      setCurrentEntry(prev => ({ ...prev, is_submitted: true, submitted_at: new Date().toISOString() }));
    }
    setIsSubmitting(false);
    setIsSubmitDialogOpen(false);
  };

  const handleAssignmentSubmit = async (assignmentId: string) => {
    setIsSubmitting(true);
    const result = await submitToAssignment(currentEntry.id, assignmentId);
    if (result.error) {
      toast({ variant: 'destructive', title: 'Submission Failed', description: result.error });
    } else {
      toast({ title: 'Success!', description: 'Entry submitted to assignment.' });
    }
    setIsSubmitting(false);
  }

  const tags = getHashtagsFromTiptapJson(isEditing ? editedContent : (currentEntry.content || ''));

  const currentTheme = isEditing ? editedTheme : (currentEntry.theme || 'default');
  const currentPageStyle = isEditing ? editedPageStyle : (currentEntry.page_style || 'default');

  const isAiAnalyzed = !!currentEntry.language_analysis || !!currentEntry.speaking_analysis;

  return (
    <div className={cn("animate-in fade-in duration-500 space-y-6", `journal-theme-${currentTheme}`)}>
      <Card className="w-full transition-colors duration-300">
        <div ref={journalContentRef} className={cn('p-6 rounded-lg', `page-style-${currentPageStyle}`)}>
          <CardHeader className="p-0 pb-6">
            {isEditing ? (
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="font-headline text-3xl h-auto p-0 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent journal-title"
                />
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <CardTitle className="font-headline text-3xl text-primary journal-title">{currentEntry.title}</CardTitle>

                {currentEntry.is_submitted && (
                  <Badge variant="default" className="bg-green-600">Submitted</Badge>
                )}
                {!isEditing && (
                    <Button 
                        size="sm" 
                        variant={activeAnalysis === 'language' ? 'default' : 'outline'}
                        onClick={() => {
                            if (!currentEntry.language_analysis) {
                                fetchFullAnalysis('language');
                            } else {
                                setActiveAnalysis(activeAnalysis === 'language' ? null : 'language');
                            }
                        }}
                        disabled={isAnalyzing}
                        className={cn(
                            "rounded-full h-8 text-[10px] font-black uppercase tracking-widest transition-all", 
                            (activeAnalysis === 'language' || !currentEntry.language_analysis)
                                ? "shadow-lg bg-red-600 hover:bg-red-700 ring-2 ring-red-300 ring-offset-2" 
                                : "animate-pulse border-red-500/50 text-red-600 hover:bg-red-50 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                        )}
                    >
                        {isAnalyzing ? (
                            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <Sparkles className={cn("mr-2 h-3.5 w-3.5", activeAnalysis !== 'language' && "animate-spin-slow")} />
                        )}
                        {!currentEntry.language_analysis 
                            ? (isAnalyzing ? 'Analyzing...' : 'Scan for Mistakes') 
                            : (activeAnalysis === 'language' ? 'Hide Corrections' : 'Scan for Mistakes')}
                    </Button>
                )}
              </div>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-2 items-center">
              <CardDescription>{formattedDate}</CardDescription>
              {isAiAnalyzed && !isEditing && (
                <Badge variant="outline" className="text-xs">
                  <Bot className="mr-1.5 h-3 w-3" />
                  AI Analyzed
                </Badge>
              )}
            </div>

            {/* Speaking Analysis / Audio Section */}
            {currentEntry.audio_url && (
              <div className="mt-8 p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-[24px] border-2 border-primary/10 shadow-inner">
                <div className="flex flex-col gap-6">
                  <div className="w-full flex items-center gap-4">
                    {audioUrl ? (
                      <AudioPlayer src={audioUrl} duration={currentEntry.audio_duration} className="flex-grow" />
                    ) : (
                      <div className="h-16 w-full bg-background/50 animate-pulse rounded-full border border-primary/10 flex items-center px-6">
                        <span className="text-xs font-bold text-muted-foreground tracking-widest uppercase">Fetching Secure Audio...</span>
                      </div>
                    )}
                  </div>

                        {(currentEntry.speaking_analysis?.score_explanation || isAiAnalyzed) && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-1 flex flex-wrap items-center gap-3">
                                    {currentEntry.speaking_analysis && (
                                        <>
                                            <div className="p-3 bg-background rounded-2xl border border-primary/10 text-center flex-grow min-w-[100px]">
                                                <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-tighter">Fluency Score</p>
                                                <p className="text-2xl font-black text-primary leading-none">{currentEntry.speaking_analysis.fluencyScore}%</p>
                                            </div>
                                            <div className="p-3 bg-background rounded-2xl border border-primary/10 text-center flex-grow min-w-[100px]">
                                                <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-tighter">Fillers Count</p>
                                                <p className="text-2xl font-black text-amber-600 leading-none">
                                                    {currentEntry.speaking_analysis.fillerWords?.reduce((acc, f) => acc + f.count, 0) ?? 0}
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>
                                
                                {currentEntry.speaking_analysis?.score_explanation && (
                                    <div className="lg:col-span-2 p-4 bg-primary/5 rounded-2xl border border-primary/10 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <Quote className="h-12 w-12 text-primary rotate-180" />
                                        </div>
                                        <p className="text-[10px] font-black uppercase text-primary/60 mb-2 tracking-widest">AI Linguistic Verdict</p>
                                        <p className="text-sm font-medium leading-relaxed italic text-foreground/90">
                                            "{currentEntry.speaking_analysis.score_explanation}"
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                </div>

                {currentEntry.speaking_analysis?.pronunciationFeedback && currentEntry.speaking_analysis.pronunciationFeedback.length > 0 && (
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-primary/10 pt-6">
                    {currentEntry.speaking_analysis.pronunciationFeedback.map((p, i) => (
                      <div key={i} className="p-4 bg-background/60 rounded-2xl border border-primary/5 flex items-start gap-3 group transition-all hover:bg-background">
                        <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
                          <AlertCircle className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-grow">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground truncate max-w-[100px]">"{p.word}"</span>
                            <span className="text-[10px] uppercase font-black text-muted-foreground shrink-0">→</span>
                            <span className="font-bold text-sm text-primary truncate max-w-[100px]">{p.suggestion}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{p.explanation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {!currentEntry.audio_url ? (
              <>
                {activeAnalysis === 'language' && currentEntry.language_analysis && !isEditing ? (
                  <LanguageAnalysisView originalContent={getPlainTextFromTiptapJson(currentEntry.content)} analysis={currentEntry.language_analysis} />
                ) : (
                  <div className="journal-content">
                    <TiptapEditor
                      content={isEditing ? editedContent : currentEntry.content}
                      onChange={setEditedContent}
                      isEditable={isEditing}
                    />
                  </div>
                )}
                {isEditing && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 mt-4 border-t">
                    <div>
                      <Label>Theme</Label>
                      <Select value={editedTheme} onValueChange={(v) => setEditedTheme(v as Theme)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a theme" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(THEMES).map(([key, value]) => (
                            <SelectItem key={key} value={key}>{value.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Page Style</Label>
                      <Select value={editedPageStyle} onValueChange={(v) => setEditedPageStyle(v as PageStyle)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select page style" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(PAGE_STYLES).map(([key, value]) => (
                            <SelectItem key={key} value={key}>{value.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
                {tags.length > 0 && !isEditing && (
                  <div className="flex flex-wrap items-center gap-4 pt-6 mt-6 border-t">
                    <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    {tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-[10px] font-bold uppercase tracking-wider py-1 px-2.5 rounded-full">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </>
            ) : null}
          </CardContent>
        </div>

        <CardFooter className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 pt-6">
          {isEditing ? (
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button onClick={handleCancelEdit} variant="outline" disabled={isSaving}><XCircle className="mr-2 h-4 w-4" /> Cancel</Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleEdit} variant="secondary">
                <Edit className="mr-2 h-4 w-4 opacity-80" />
                Edit
              </Button>
              <DeleteEntryButton entryId={currentEntry.id} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <FileDown className="mr-2 h-4 w-4 opacity-80" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleJournalExport('txt')}>As .txt file</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleJournalExport('pdf')}>As .pdf file</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          <Button asChild>
            <Link href="/dashboard">
              <PlusCircle className="mr-2 h-4 w-4 opacity-80" />
              New Entry
            </Link>
          </Button>
        </CardFooter>
      </Card>



      {profile.ai_analysis_enabled && !isEditing && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="font-headline text-2xl">Entry Analysis</CardTitle>
                <CardDescription>
                  {(currentEntry.source as any) === 'voice' ? 'Technical feedback on your spoken delivery.' : 'Get AI-powered insights into your writing.'}
                </CardDescription>
              </div>

              {(currentEntry.source as any) !== 'voice' && (
                <div className="flex bg-muted/30 p-1 rounded-full border border-primary/10">
                  <Button
                    variant={activeAnalysis === 'personal' ? 'default' : 'ghost'}
                    size="sm"
                    className={cn("rounded-full px-4 h-8 text-[10px] font-black uppercase tracking-widest transition-all", activeAnalysis === 'personal' && "shadow-md")}
                    onClick={() => setActiveAnalysis('personal')}
                  >
                    Personal
                  </Button>
                  <Button
                    variant={activeAnalysis === 'language' ? 'default' : 'ghost'}
                    size="sm"
                    className={cn("rounded-full px-4 h-8 text-[10px] font-black uppercase tracking-widest transition-all", activeAnalysis === 'language' && "shadow-md")}
                    onClick={() => setActiveAnalysis('language')}
                  >
                    Language
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isAnalyzing && (
              <div className="flex flex-col items-center justify-center text-muted-foreground gap-2 min-h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p>Performing deep analysis...</p>
              </div>
            )}

            {!isAnalyzing && activeAnalysis === 'personal' && (
              <div className="p-4 border rounded-md bg-background/50 animate-in fade-in duration-300 min-h-[300px] flex flex-col justify-center">
                {currentEntry.analysis?.personal ? (
                  <>
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <h3 className="font-headline text-xl text-center">Personal Analysis</h3>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Info className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 text-sm">{analysisExplanations.personal}</PopoverContent>
                      </Popover>
                    </div>
                    <AnalysisChart data={formatChartData(currentEntry.analysis, 'sentiment')} type='sentiment' analysisData={currentEntry.analysis} />
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <AnalysisChart data={formatChartData(currentEntry.analysis, 'mood')} type='mood' analysisData={currentEntry.analysis} />
                      <AnalysisChart data={formatChartData(currentEntry.analysis, 'productivity')} type='productivity' analysisData={currentEntry.analysis} />
                      <AnalysisChart data={formatChartData(currentEntry.analysis, 'creativity')} type='creativity' analysisData={currentEntry.analysis} />
                    </div>
                  </>
                ) : (
                  <div className="text-center text-muted-foreground p-4">
                    <p>No personal analysis data available.</p>
                    <Button onClick={() => fetchFullAnalysis('personal')} className="mt-2" variant="secondary">Analyze Now</Button>
                  </div>
                )}
              </div>
            )}

            {!isAnalyzing && activeAnalysis === 'language' && (
              <div className="p-4 border rounded-md bg-background/50 animate-in fade-in duration-300 min-h-[300px] flex flex-col justify-center">
                {(currentEntry.analysis?.language || (currentEntry.source as any) === 'voice') ? (
                  <>
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <h3 className="font-headline text-xl text-center">Language Proficiency</h3>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Info className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 text-sm">{analysisExplanations.language}</PopoverContent>
                      </Popover>
                    </div>

                    <div className="flex items-center justify-center gap-2 mb-8">
                      <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent flex-1" />
                      <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary/60 flex items-center gap-2">
                        {(currentEntry.source as any) === 'voice' ? (
                          <><Mic2 className="h-4 w-4" /> Spoken Performance</>
                        ) : (
                          <><FileText className="h-4 w-4" /> Written Assessment</>
                        )}
                      </h3>
                      <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent flex-1" />
                    </div>

                    <div className={cn("grid grid-cols-1 gap-4", (currentEntry.source as any) === 'voice' ? 'md:grid-cols-4' : 'md:grid-cols-3')}>
                      <div className="text-center p-2 border rounded-lg bg-background/30 transition-all hover:bg-background/50">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-center gap-1">
                          <BookOpenCheck className="h-3 w-3" /> {(currentEntry.source as any) === 'voice' ? 'Grammar' : 'Grammatical Accuracy'}
                        </p>
                        <p className="text-4xl font-bold font-headline text-primary mt-1">
                          {(currentEntry.source as any) === 'voice'
                            ? (currentEntry.speaking_analysis?.grammarScore?.toFixed(0) ?? '-')
                            : (currentEntry.analysis?.language?.grammaticalAccuracy?.toFixed(0) ?? '-')}
                        </p>
                      </div>

                      <div className="text-center p-2 border rounded-lg bg-background/30 transition-all hover:bg-background/50">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-center gap-1">
                          <Sparkles className="h-3 w-3" /> {(currentEntry.source as any) === 'voice' ? 'Vocabulary' : 'Vocabulary Richness'}
                        </p>
                        <p className="text-4xl font-bold font-headline text-primary mt-1">
                          {(currentEntry.source as any) === 'voice'
                            ? (currentEntry.speaking_analysis?.vocabularyScore?.toFixed(0) ?? '-')
                            : (currentEntry.analysis?.language?.vocabularyRichness?.toFixed(0) ?? '-')}
                        </p>
                      </div>

                      <div className="text-center p-2 border rounded-lg bg-background/30 transition-all hover:bg-background/50">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-center gap-1">
                          <Languages className="h-3 w-3" /> {(currentEntry.source as any) === 'voice' ? 'Fluency' : 'Fluency & Cohesion'}
                        </p>
                        <p className="text-4xl font-bold font-headline text-primary mt-1">
                          {(currentEntry.source as any) === 'voice'
                            ? (currentEntry.speaking_analysis?.fluencyScore?.toFixed(0) ?? '-')
                            : (currentEntry.analysis?.language?.fluencyAndCohesion?.toFixed(0) ?? '-')}
                        </p>
                      </div>

                      {(currentEntry.source as any) === 'voice' && (
                        <div className="text-center p-2 border rounded-lg bg-background/30 transition-all hover:bg-background/50">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-center gap-1"><Zap className="h-3 w-3" />Clarity</p>
                          <p className="text-4xl font-bold font-headline text-primary mt-1">
                            {currentEntry.speaking_analysis?.clarityScore?.toFixed(0) ?? '-'}
                          </p>
                        </div>
                      )}
                    </div>

                    {(currentEntry.source as any) === 'voice' && currentEntry.speaking_analysis && (
                        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-primary/10 pt-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                             {(currentEntry.speaking_analysis.grammarCorrections?.length > 0 || currentEntry.speaking_analysis.vocabularyEnhancements?.length > 0) ? (
                                <>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="p-1.5 bg-blue-500/10 text-blue-600 rounded-lg">
                                                <BookOpenCheck className="h-4 w-4" />
                                            </div>
                                            <h4 className="text-xs font-black uppercase tracking-widest text-primary/70">Grammar Insights</h4>
                                        </div>
                                        <ul className="space-y-3">
                                            {currentEntry.speaking_analysis.grammarCorrections.length > 0 ? (
                                                currentEntry.speaking_analysis.grammarCorrections.map((m, i) => (
                                                    <li key={i} className="flex gap-3 text-sm group">
                                                        <span className="text-blue-500 mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                                                        <div className="space-y-1">
                                                            <p className="font-medium text-foreground">
                                                               <span className="line-through text-muted-foreground/60 opacity-70">"{m.originalPhrase}"</span>
                                                               <span className="mx-2 text-primary font-black">→</span>
                                                               <span className="text-blue-600 font-bold bg-blue-50 dark:bg-blue-900/20 px-1.5 rounded">"{m.correctedPhrase}"</span>
                                                            </p>
                                                            <p className="text-xs text-muted-foreground leading-relaxed italic">{m.explanation}</p>
                                                        </div>
                                                    </li>
                                                ))
                                            ) : (
                                                <li className="text-xs text-muted-foreground italic pl-4">No major grammar mistakes detected. Great job!</li>
                                            )}
                                        </ul>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="p-1.5 bg-amber-500/10 text-amber-600 rounded-lg">
                                                <Sparkles className="h-4 w-4" />
                                            </div>
                                            <h4 className="text-xs font-black uppercase tracking-widest text-primary/70">Vocabulary Upgrades</h4>
                                        </div>
                                        <ul className="space-y-3">
                                            {currentEntry.speaking_analysis.vocabularyEnhancements.length > 0 ? (
                                                currentEntry.speaking_analysis.vocabularyEnhancements.map((m, i) => (
                                                    <li key={i} className="flex gap-3 text-sm group">
                                                        <span className="text-amber-500 mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                                                        <div className="space-y-1">
                                                            <p className="font-medium text-foreground">
                                                               <span className="opacity-70">"{m.originalWord}"</span>
                                                               <span className="mx-2 text-primary font-black underline decoration-amber-300">→</span>
                                                               <span className="text-amber-600 font-bold bg-amber-50 dark:bg-amber-900/20 px-1.5 rounded">"{m.suggestedWord}"</span>
                                                            </p>
                                                            <p className="text-xs text-muted-foreground leading-relaxed italic">{m.explanation}</p>
                                                        </div>
                                                    </li>
                                                ))
                                            ) : (
                                                <li className="text-xs text-muted-foreground italic pl-4">Your vocabulary was appropriate for this entry.</li>
                                            )}
                                        </ul>
                                    </div>
                                </>
                             ) : (
                                 <div className="col-span-full py-8 text-center bg-primary/5 rounded-2xl border border-dashed border-primary/20">
                                     <p className="text-sm font-bold text-primary/60 uppercase tracking-widest">Perfect Linguistic Delivery!</p>
                                     <p className="text-xs text-muted-foreground mt-1">AI found no specific grammar or vocabulary improvements for this recording.</p>
                                 </div>
                             )}
                        </div>
                    )}

                    {(currentEntry.source as any) === 'voice' && (!currentEntry.speaking_analysis || !currentEntry.speaking_analysis.clarityScore) && (
                      <div className="mt-8 flex flex-col items-center justify-center p-8 border-2 border-dashed border-primary/20 rounded-3xl bg-primary/5 transition-all">
                        {isAnalyzing ? (
                          <div className="w-full space-y-6">
                            <div className="flex flex-col items-center gap-2">
                              <div className="h-12 w-12 bg-primary/20 rounded-full flex items-center justify-center animate-pulse">
                                <Sparkles className="h-6 w-6 text-primary animate-spin-slow" />
                              </div>
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">AI Evaluating Delivery...</p>
                            </div>
                          </div>
                        ) : (
                          <>
                            <Mic2 className="h-10 w-10 text-primary/40 mb-4 animate-bounce" />
                            <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-6 text-center max-w-[200px]">
                              Technical analysis missing or interrupted.
                            </p>
                            <Button
                              onClick={handleVoiceAnalysis}
                              className="bg-primary hover:bg-primary/90 text-primary-foreground font-black px-10 py-7 rounded-full shadow-2xl transition-all hover:scale-105 group"
                            >
                              <Zap className="mr-3 h-5 w-5 fill-current group-hover:animate-pulse" />
                              Retry Technical Analysis
                            </Button>
                          </>
                        )}
                      </div>
                    )}

                    {(currentEntry.source as any) !== 'voice' && (!currentEntry.analysis || !currentEntry.analysis.language) && (
                      <div className="mt-8 flex flex-col items-center justify-center p-6 border-2 border-dashed border-primary/20 rounded-2xl bg-primary/5">
                        <FileText className="h-8 w-8 text-primary/40 mb-3 animate-pulse" />
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4 text-center">
                          Language assessment not yet generated.
                        </p>
                        <Button
                          onClick={() => fetchFullAnalysis('language')}
                          disabled={isAnalyzing}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground font-black px-8 py-6 rounded-full shadow-lg transition-all hover:scale-105"
                        >
                          {isAnalyzing ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Evaluating Writing...</>
                          ) : (
                            <><Zap className="mr-2 h-4 w-4 fill-current" /> Run Written Assessment</>
                          )}
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center text-muted-foreground p-4">
                    <p>No language analysis data available.</p>
                    <Button onClick={() => fetchFullAnalysis('language')} className="mt-2" variant="secondary">Analyze Now</Button>
                  </div>
                )}
              </div>
            )}
            {!activeAnalysis && !isAnalyzing && (
              <div className="text-center text-muted-foreground p-8">
                <p>Select an analysis type above to view insights.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {profile.ai_analysis_enabled === false && !isEditing && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">AI Analysis Disabled</CardTitle>
            <CardDescription>To see your analysis, enable the feature in your profile settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary" className="mt-4">
              <Link href="/profile">
                <Star className="mr-2 h-4 w-4" />
                Go to Profile
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Teacher Feedback Display */}
      {currentEntry.teacher_feedback && !isEditing && (
        <Card className="mt-6 overflow-hidden border-primary/20 shadow-lg">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <CardTitle className="font-headline text-xl text-primary flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Teacher's Feedback
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {currentEntry.teacher_feedback.split(/(\[MISTAKE: ".*?"\])/).map((part, i) => {
                const mistakeMatch = part.match(/\[MISTAKE: "(.*?)"\]/);
                if (mistakeMatch) {
                  return (
                    <div key={i} className="flex gap-4 group mt-4 first:mt-0">
                      <div className="w-1 bg-primary/30 rounded-full group-hover:bg-primary transition-colors" />
                      <div className="flex-grow">
                        <div className="text-[10px] uppercase font-black tracking-widest text-primary/40 mb-1">Mistake Identified:</div>
                        <div className="p-3 bg-primary/5 border border-primary/10 rounded-xl font-medium italic text-primary/80 relative">
                          <Quote className="absolute -top-2 -left-2 h-4 w-4 text-primary/20 fill-primary/10" />
                          "{mistakeMatch[1]}"
                        </div>
                      </div>
                    </div>
                  );
                }
                if (!part.trim()) return null;
                return (
                  <p key={i} className="whitespace-pre-wrap text-foreground leading-relaxed pl-5 border-l-2 border-transparent">
                    {part.replace(/^>\s*/, '')}
                  </p>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {!currentEntry.is_project_log && profile.ai_analysis_enabled && !isEditing && (
        <div className="mt-6">
          <JournalChat entry={currentEntry} profile={profile} />
        </div>
      )}

      {/* Report Dialog */}
      <AlertDialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <AlertDialogContent className="max-w-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-headline text-2xl">Generated Project Report</AlertDialogTitle>
            <AlertDialogDescription>
              Here is the AI-generated summary of your practice and updates.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <ScrollArea className="max-h-[60vh] p-4 border rounded-md">
            <div ref={reportContentRef} className={cn('prose dark:prose-invert max-w-none', `journal-theme-${currentTheme}`, `page-style-${currentPageStyle}`)} dangerouslySetInnerHTML={{ __html: sanitizeHtml(tiptapJsonToHtml(markdownToTiptapJson(generatedReport || ''))) }} />
          </ScrollArea>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button><FileDown className="mr-2 h-4 w-4" /> Export Report</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleReportExport('txt')}>As .txt file</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleReportExport('pdf')}>As .pdf file</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {profile && (
        <AddIterationDialog
          profile={profile}
          onEntryGenerated={handleAddIteration}
          isEditing={!!iterationToEdit}
          iterationToEdit={iterationToEdit}
          onEntryUpdated={handleUpdateIteration}
          isOpen={isAddOrEditDialogOpen}
          onOpenChange={setIsAddOrEditDialogOpen}
        >
          <div />
        </AddIterationDialog>
      )}

      {/* Submission Confirmation Dialog */}
      <AlertDialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit This Entry for Review?</AlertDialogTitle>
            <AlertDialogDescription>
              This will submit the current entry to your teacher for feedback. You will not be able to edit it after submission. Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsSubmitDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSimpleSubmit} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSubmitting ? 'Submitting...' : 'Yes, Submit'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      <AlertDialog open={!!iterationToDelete} onOpenChange={(open) => !open && setIterationToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this update?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this project update.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIterationToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => iterationToDelete && handleDeleteIteration(iterationToDelete.id)}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
