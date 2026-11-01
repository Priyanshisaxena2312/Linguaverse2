
'use server';

/**
 * @fileOverview A Genkit flow to compare two similar words, returning structured data.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const CompareWordsInputSchema = z.object({
  word1: z.string().describe('The first word to compare.'),
  word2: z.string().describe('The second word to compare.'),
});

const WordDetailSchema = z.object({
    pronunciation: z.string().optional().describe('The phonetic spelling of the word.'),
    partOfSpeech: z.string().describe("The word's part of speech (e.g., Noun, Verb)."),
    definition: z.string().describe('A concise definition of the word.'),
    example: z.string().describe('An example sentence demonstrating its use.'),
});

const CompareWordsOutputSchema = z.object({
  word1_details: WordDetailSchema,
  word2_details: WordDetailSchema,
  mnemonic: z.string().optional().describe('An optional mnemonic or simple tip to remember the difference.'),
});

export type CompareWordsInput = z.infer<typeof CompareWordsInputSchema>;
export type CompareWordsOutput = z.infer<typeof CompareWordsOutputSchema>;

export async function compareWords(input: CompareWordsInput): Promise<CompareWordsOutput> {
  return compareWordsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'compareWordsPrompt',
  input: { schema: CompareWordsInputSchema },
  output: { schema: CompareWordsOutputSchema },
  prompt: `You are an expert linguist and English teacher. Your task is to provide a structured comparison between two similar-sounding or commonly confused words: "{{word1}}" and "{{word2}}".

Your response MUST be in the specified JSON format. For each word, provide:
1.  **pronunciation**: The phonetic spelling of the word.
2.  **partOfSpeech**: The word's part of speech (e.g., Noun, Verb, Adjective).
3.  **definition**: A concise, clear definition.
4.  **example**: A simple sentence showing the word in use.
5.  **mnemonic**: (Optional, but highly recommended) A short, memorable tip to help a learner remember the difference.

Analyze "{{word1}}" and "{{word2}}" and return the structured JSON.
`,
});

const compareWordsFlow = ai.defineFlow(
  {
    name: 'compareWordsFlow',
    inputSchema: CompareWordsInputSchema,
    outputSchema: CompareWordsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("The AI model did not return a valid comparison.");
    }
    return output;
  }
);
