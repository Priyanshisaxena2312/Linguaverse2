

'use client';

import { useRouter } from 'next/navigation';
import { JournalEntryForm } from '@/components/journal-entry-form';
import { VoiceJournalForm } from '@/components/voice-journal-form';
import { addEntry } from '@/app/journal/actions';
import { useToast } from '@/hooks/use-toast';
import type { JournalEntryForCreate, Profile, AnalyzeTextForLanguageOutput, GrammarCorrection, VocabularySuggestion } from '@/lib/types';
import { analyzeJournalEntry } from '@/ai/flows/analyze-journal-entry';
import { analyzeTextForLanguage } from '@/ai/flows/analyze-text-for-language';
import type { AnalyzeJournalEntryOutput } from '@/lib/types';
import { getAIErrorMessage, getPlainTextFromTiptapJson, convertSignedUrlsToStoragePaths } from '@/lib/utils';
import { addDictionaryWord } from '@/app/journal/[id]/actions';

type EntrySource = 'manual' | 'chat' | 'voice';

type EntryModeSwitcherProps = {
  profile: Profile;
  isProfessional: boolean;
  mode: 'text' | 'voice';
};

export function EntryModeSwitcher({ profile, isProfessional, mode }: EntryModeSwitcherProps) {
  const router = useRouter();
  const { toast } = useToast();
  const canUseAiAnalysis = profile.plan !== 'free' && profile.ai_analysis_enabled;

  const handleEntryGenerated = async (entry: JournalEntryForCreate, source: EntrySource, audioDataUri?: string) => {
    try {
      let analysisResult: AnalyzeJournalEntryOutput | null = null;
      let languageAnalysisResult: AnalyzeTextForLanguageOutput | null = null;

      const isProjectLog = entry.is_project_log ?? false;
      const plainText = getPlainTextFromTiptapJson(entry.content);

      if (plainText && canUseAiAnalysis && source !== 'voice') {
        const analysisType = isProfessional ? 'language' : 'personal';
        analysisResult = await analyzeJournalEntry({
          journalContent: plainText,
          analysisType: analysisType
        });
      }

      if (plainText && isProfessional && source !== 'voice') {
        languageAnalysisResult = await analyzeTextForLanguage({
          text: plainText,
          targetLanguage: 'English' // This could be made dynamic later
        });

        if (languageAnalysisResult) {
          const correctionsToSave = [...languageAnalysisResult.grammarCorrections, ...languageAnalysisResult.vocabularyEnhancements];
          for (const item of correctionsToSave) {
            const isGrammar = 'correctedPhrase' in item;
            await addDictionaryWord({
              word: isGrammar ? (item as GrammarCorrection).originalPhrase : (item as VocabularySuggestion).originalWord,
              original_context: plainText.substring(0, 500),
              corrected_context: isGrammar ? (item as GrammarCorrection).correctedPhrase : (item as VocabularySuggestion).suggestedWord,
              explanation: item.explanation,
              type: 'written',
              pronunciation_url: null,
            });
          }
        }
      }

      const contentWithPermanentPaths = convertSignedUrlsToStoragePaths(entry.content);

      const entryToSave: JournalEntryForCreate = {
        ...entry,
        content: contentWithPermanentPaths,
        analysis: analysisResult,
        language_analysis: languageAnalysisResult,
        is_project_log: isProjectLog,
        iterations: isProjectLog ? [] : null,
      };

      const result = await addEntry(entryToSave, source);

      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'Limit Reached or Error',
          description: result.error,
        });
        return;
      }

      if (result.data) {
        toast({
          title: 'Success!',
          description: 'Your new entry has been saved.',
        });

        // Trigger Background Spoken Analysis for Voice entries
        if (source === 'voice' && audioDataUri) {
          const { analyzeVoiceEntry } = await import('@/app/journal/actions');
          const analysisPromise = analyzeVoiceEntry(result.data.id, audioDataUri);
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('slow-internet')), 60000)
          );

          Promise.race([analysisPromise, timeoutPromise])
            .catch(err => {
              if (err.message === 'slow-internet') {
                toast({
                  variant: 'destructive',
                  title: 'Connection Latency',
                  description: 'Internet is slow, try analyzing again later.'
                });
              }
            });
        }

        router.push(`/journal/${result.data.id}`);
      } else {
        throw new Error('Failed to save the entry.');
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getAIErrorMessage(error),
      });
    }
  };

  if (mode === 'voice') {
    return <VoiceJournalForm onEntryGenerated={(entry, audio) => handleEntryGenerated(entry, 'voice', audio)} profile={profile} isIterationMode={isProfessional} />
  }

  if (mode === 'text') {
    return <JournalEntryForm onEntryGenerated={(entry) => handleEntryGenerated(entry, 'manual')} profile={profile} isIterationMode={isProfessional} />
  }

  return null;
}
