
'use server';

/**
 * @fileOverview A Genkit flow to analyze the context and nuances between two similar sentences.
 */

import { ai } from '@/ai/genkit';
import { AnalyzeSentenceContextInputSchema, AnalyzeSentenceContextOutputSchema, type AnalyzeSentenceContextInput, type AnalyzeSentenceContextOutput } from '@/lib/types';


export async function analyzeSentenceContext(input: AnalyzeSentenceContextInput): Promise<AnalyzeSentenceContextOutput> {
    return analyzeSentenceContextFlow(input);
}


const prompt = ai.definePrompt({
  name: 'analyzeSentenceContextPrompt',
  input: { schema: AnalyzeSentenceContextInputSchema },
  output: { schema: AnalyzeSentenceContextOutputSchema },
  prompt: `You are a linguistics expert and English teacher. Your task is to compare two sentences/phrases provided by a student and explain the subtle differences in their context, tone, and use cases.

**Sentences to Compare:**
1. "{{sentence1}}"
2. "{{sentence2}}"

**Instructions:**
1.  **Tone**: Professional, academic, and authoritative. Act as a senior linguistics expert.
2.  **Conciseness**: Avoid all conversational filler, introductory fluff, or summary conclusions.
3.  **Context Class**: Provide exactly one descriptive word (e.g., 'Formal', 'Colloquial', 'Professional').
4.  **Use Case (Bulleted)**: Describe specific scenarios for each sentence using a maximum of 3 concise bullet points. Focus on the relationship between speaker and listener.
5.  **Subtle Differences (Bulleted)**: Breakdown the linguistic nuances using a maximum of 4 concise bullet points. Cover grammar, emotional undertones, or politeness levels.
6.  **Formatting Rule**: Use standard markdown bullet points (-). DO NOT use numbered lists or long paragraphs. Max 25 words per bullet point.

**Target Format Example:**
**Use Case:**
- Sentence 1 is for [Scenario A].
- Sentence 2 is for [Scenario B].
- Use Sentence 1 with [Listener X], and Sentence 2 with [Listener Y].

**Subtle Differences:**
- [Difference 1]
- [Difference 2]
- [Difference 3]

Now, provide your expert, concise analysis.`,
});

export const analyzeSentenceContextFlow = ai.defineFlow(
  {
    name: 'analyzeSentenceContextFlow',
    inputSchema: AnalyzeSentenceContextInputSchema,
    outputSchema: AnalyzeSentenceContextOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("The AI model did not return a valid context analysis.");
    }
    return output;
  }
);
