
'use server';

/**
 * @fileOverview A Genkit flow to define a word with meaning, explanation, and use case.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const DefineWordInputSchema = z.object({
  word: z.string().describe('The word to be defined.'),
});

const DefineWordOutputSchema = z.object({
  word: z.string().describe('The word that was defined.'),
  pronunciation: z.string().optional().describe('The phonetic spelling of the word (e.g., [ɪˈfɛm(ə)r(ə)l]).'),
  meaning: z.string().describe('A concise, dictionary-style meaning of the word.'),
  explanation: z.string().describe('A simple, easy-to-understand explanation of the word and its nuances.'),
  use_case: z.string().describe('An example sentence showing how to use the word correctly.'),
});

export type DefineWordInput = z.infer<typeof DefineWordInputSchema>;
export type DefineWordOutput = z.infer<typeof DefineWordOutputSchema>;


export async function defineWord(input: DefineWordInput): Promise<DefineWordOutput> {
  return defineWordFlow(input);
}


const prompt = ai.definePrompt({
  name: 'defineWordPrompt',
  input: { schema: DefineWordInputSchema },
  output: { schema: DefineWordOutputSchema },
  prompt: `You are an expert lexicographer and teacher. Your task is to provide a clear and comprehensive definition for the given word.

The word to define is: {{{word}}}

Provide the following in the specified JSON format:
1.  **word**: The original word itself.
2.  **pronunciation**: The phonetic spelling of the word (e.g., [ɪˈfɛm(ə)r(ə)l]).
3.  **meaning**: A concise, dictionary-style definition.
4.  **explanation**: A simple, easy-to-understand explanation. Break down the root or context if it helps.
5.  **use_case**: A single, clear example sentence demonstrating the word's correct usage.
`,
});

const defineWordFlow = ai.defineFlow(
  {
    name: 'defineWordFlow',
    inputSchema: DefineWordInputSchema,
    outputSchema: DefineWordOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("The AI model did not return a valid definition.");
    }
    return output;
  }
);
