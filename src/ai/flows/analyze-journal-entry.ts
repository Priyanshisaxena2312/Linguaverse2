
'use server';

/**
 * @fileOverview A Genkit flow to analyze a journal entry. This flow has two modes:
 * 1. Personal Mode: Analyzes for sentiment, mood, productivity, and creativity.
 * 2. Language Mode: Analyzes for language proficiency metrics like grammar, vocabulary, and fluency.
 *
 * - analyzeJournalEntry - A function that handles the journal analysis process.
 */

import {ai} from '@/ai/genkit';
import { AnalyzeJournalEntryInputSchema, AnalyzeJournalEntryOutputSchema, type AnalyzeJournalEntryInput, type AnalyzeJournalEntryOutput } from '@/lib/types';
import { z } from 'zod';

// Define an internal input schema for the prompt that includes the boolean flags
const InternalPromptInputSchema = AnalyzeJournalEntryInputSchema.extend({
  isPersonalAnalysis: z.boolean(),
  isLanguageAnalysis: z.boolean(),
});

export async function analyzeJournalEntry(input: AnalyzeJournalEntryInput): Promise<AnalyzeJournalEntryOutput> {
  return analyzeJournalEntryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeJournalEntryPrompt',
  input: { schema: InternalPromptInputSchema },
  output: { schema: AnalyzeJournalEntryOutputSchema },
  prompt: `You are an expert textual analyst. Your task is to analyze the provided journal entry based on the requested analysis type.

**Entry Content:**
---
{{{journalContent}}}
---

{{#if isPersonalAnalysis}}
**Personal Analysis Mode**
You are an expert in understanding human emotion, productivity, and creativity. Analyze the entry for the following:
- **Sentiment**: Provide scores for positive, negative, and neutral components (summing to 100), and an overall score from 0-100.
- **Mood**: Identify the top 4 moods with percentages (summing to 100) and provide an overall mood score from 0-100.
- **Productivity**: Score from 0-100 based on mentions of tasks, goals, or procrastination.
- **Creativity**: Score from 0-100 based on new ideas, problem-solving, or routine.
Format your response within the 'personal' field of the output JSON.
{{/if}}

{{#if isLanguageAnalysis}}
**Language Analysis Mode**
You are an expert language teacher. Analyze the student's writing for the following metrics, providing a score from 0 to 100 for each.
- **Grammatical Accuracy**: How correct is the grammar, punctuation, and sentence structure? (100 = flawless).
- **Vocabulary Richness**: How diverse, advanced, and appropriately used is the vocabulary? (100 = native-level).
- **Fluency and Cohesion**: How naturally does the text flow? Are ideas connected logically? (100 = very smooth and cohesive).
Format your response within the 'language' field of the output JSON.
{{/if}}

Return the analysis in the specified JSON format.
`,
});

const analyzeJournalEntryFlow = ai.defineFlow(
  {
    name: 'analyzeJournalEntryFlow',
    inputSchema: AnalyzeJournalEntryInputSchema,
    outputSchema: AnalyzeJournalEntryOutputSchema,
  },
  async (input) => {
    // Determine which mode to run based on the analysisType and create the correct input for the prompt
    const promptInput = {
        journalContent: input.journalContent,
        analysisType: input.analysisType,
        isPersonalAnalysis: input.analysisType === 'personal',
        isLanguageAnalysis: input.analysisType === 'language',
    };
    const {output} = await prompt(promptInput);
    return output!;
  }
);
