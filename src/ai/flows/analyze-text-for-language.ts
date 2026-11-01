
'use server';

/**
 * @fileOverview A Genkit flow to analyze a text for grammar and vocabulary improvement.
 *
 * - analyzeTextForLanguage - A function that handles the language analysis process.
 */

import {ai} from '@/ai/genkit';
import type { AnalyzeTextForLanguageInput, AnalyzeTextForLanguageOutput } from '@/lib/types';
import { AnalyzeTextForLanguageInputSchema, AnalyzeTextForLanguageOutputSchema } from '@/lib/types';
import { z } from 'zod';

// Internal schema to include boolean flags for the prompt
const InternalPromptInputSchema = AnalyzeTextForLanguageInputSchema.extend({
    isBeginner: z.boolean(),
    isAdvanced: z.boolean(),
    isUnknown: z.boolean(),
});

export async function analyzeTextForLanguage(input: AnalyzeTextForLanguageInput): Promise<AnalyzeTextForLanguageOutput> {
  return analyzeTextForLanguageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeTextForLanguagePrompt',
  input: {schema: InternalPromptInputSchema},
  output: {schema: AnalyzeTextForLanguageOutputSchema},
  prompt: `You are an expert language teacher, specializing in helping students improve their writing skills in {{{targetLanguage}}}. Your task is to analyze the following text and provide constructive feedback, adapting your style to the student's proficiency level.

{{#if isBeginner}}
**Student Level: Beginner.**
- This student has a low proficiency score.
- Your explanations MUST be in very simple, basic English.
- Focus on fundamental errors like verb tenses, subject-verb agreement, and basic sentence structure.
- Keep vocabulary suggestions simple and common.
- Adopt a very encouraging and gentle tone, like a teacher helping a first-year student.
{{/if}}
{{#if isAdvanced}}
**Student Level: Advanced.**
- This student has a high proficiency score.
- You can provide more nuanced explanations.
- Your explanations should use natural-sounding Indian English, as you are tutoring an Indian student. Use phrases common in Indian English.
- Offer more sophisticated and idiomatic vocabulary suggestions.
{{/if}}
{{#if isUnknown}}
**Student Level: Unknown.** Assume an intermediate level. Provide clear but comprehensive explanations.
{{/if}}

Analyze the following text:
---
{{{text}}}
---

Your analysis must identify two types of issues and assign a **severity** to each:

1.  **Grammar Corrections**: Identify any grammatical errors. For each, provide a simple explanation, a **mistakeCategory**, and a **severity** ('error' for glaring mistakes, 'warning' for minor slips).
    The category MUST be one of the following: 
    - "Subject-Verb Agreement"
    - "Tense"
    - "Article Usage"
    - "Prepositions"
    - "Word Order"
    - "Punctuation"
    - "Sentence Structure"
    - "Nouns/Pronouns"
    - "Other"
    
    **CRITICAL RULE FOR 'Other' CATEGORY:** If you use the "Other" category, you MUST add a very specific, short description of the error type to the beginning of the explanation. For example: "Explanation: Incorrect Idiom. The phrase 'on the other hand' is used to present a contrasting point...".

2.  **Vocabulary Enhancements**: Identify words or simple phrases that could be replaced with better alternatives. For each, provide the original word, the suggested replacement, an explanation of the new word's meaning and why it's a better choice, adapted to the student's level. For each, assign a **severity** ('warning' for slightly off word choice, 'info' for better sounding alternatives).

Focus on the most important and teachable points. Do not overwhelm the user. Aim for 2-4 grammar corrections and 2-4 vocabulary suggestions. **Use Markdown formatting (like bolding for emphasis or bullet points for lists) in your explanations to make them clear and easy to read.**

Return the full analysis in the specified JSON format.`,
});

const analyzeTextForLanguageFlow = ai.defineFlow(
  {
    name: 'analyzeTextForLanguageFlow',
    inputSchema: AnalyzeTextForLanguageInputSchema,
    outputSchema: AnalyzeTextForLanguageOutputSchema,
  },
  async input => {
    let isBeginner = false;
    let isAdvanced = false;
    let isUnknown = false;

    if (input.proficiencyScore !== undefined) {
        if (input.proficiencyScore <= 50) {
            isBeginner = true;
        } else {
            isAdvanced = true;
        }
    } else {
        isUnknown = true;
    }
      
    const promptInput = {
        ...input,
        isBeginner,
        isAdvanced,
        isUnknown,
    };

    const {output} = await prompt(promptInput);
    return output!;
  }
);
